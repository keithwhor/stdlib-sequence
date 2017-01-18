const f = require('f');
const fs = require('fs');
const async = require('async');
const Nt = require('ntseq');

// Get first 1,000,000 nt of E. coli K12 genome
const K12 = fs.readFileSync('./seq/ecolik12.txt').toString().substr(0, 1000000);

module.exports = (params, callback) => {

  let q = (params.kwargs.q || '') + '';
  let seq = (params.kwargs.seq || '') + '';

  // Set seq to K12 if none provided
  seq = seq || K12;

  let count = 'count' in params.kwargs ? parseInt(params.kwargs.count) || 0 : 1;
  count = Math.min(100, Math.max(0, count));

  let repeat = parseInt(params.kwargs.repeat) || 0;
  repeat = Math.max(1, repeat);

  // show query stats?
  let stats = 'stats' in params.kwargs;

  // Repeat query if provided
  q = q.repeat(repeat);

  if (q.length > 5000000 || seq.length > 5000000) {
    return callback(new Error('Query and sequence length must be <= 5000000 (including repeats)'));
  }

  // Set max workers to 200
  let size = Math.max(10, 1000000000 / q.length);
  let workers = Math.min(200, Math.ceil(seq.length / size));
  size = Math.ceil(seq.length / workers);

  // if workers === 1, no need to parallelize
  workers = workers <= 1 ? 0 : workers;

  let time = {};

  time.total = new Date().valueOf();
  time.prepare = new Date().valueOf();

  // Load sequences into memory (parses into binary data)
  let query = new Nt.Seq().read(q);
  let sequence = new Nt.Seq().read(seq);
  let map = sequence.mapSequence(query);

  time.prepare = new Date().valueOf() - time.prepare;

  time.map = new Date().valueOf();

  // Parallelization (Map) step:
  //   Use f(`${params.service}/map`) to send remote requests
  //    to this service and parallelize (make use of server-less architecture!)
  //   NOTE: `params.service` will be "." when running locally so will run
  //    serially for testing purposes
  async.map(
    Array(workers).fill().map((v, i) => {
      return {
        q: q,
        seq: seq.substr(i * size, size),
        offset: i * size
      };
    }),
    (kwargs, cb) => f(`${params.service}/map`)(kwargs, (err, result) => cb(err, result)),
    (err, results) => {

      if (err) {
        return callback(err);
      }

      let meta = [];

      // if we have results, it means we parallelized, so we
      //  need to perform REDUCE step
      if (results.length) {

        let adjust = q.length - 1;

        time.map = new Date().valueOf() - time.map;
        time.reduce = new Date().valueOf();

        // Reduction straightforward --- save all results in their position as
        //  dictated by `offset`
        let reduced = results.reduce((reduced, result, i) => {
          let offset = i * size;
          reduced.meta = reduced.meta.concat(result.meta);
          result.data.forEach((r, j) => {
            let n = j + offset;
            if (!reduced.data[n]) {
              reduced.data[n] = r;
            } else {
              reduced.data[n] += r;
            }
          });
          return reduced;
        }, {meta: [], data: Array(seq.length + adjust)});

        // NtSeq: initialize with preformed data, i.e. don't do map step
        map.initialize(reduced.data);

        time.reduce = new Date().valueOf() - time.reduce;

        meta = reduced.meta;

      } else {

        // If no workers, initialize map with no data --- will perform map step
        //  here instead, no need for reduce.
        map.initialize();
        time.map = new Date().valueOf() - time.map;
        time.reduce = 0;

      }

      time.sort = new Date().valueOf();

      // sort results
      map.sort();

      time.sort = new Date().valueOf() - time.sort;

      // format results
      let alignResults = map.top(count).map(result => {
        return {
          position: result.position,
          matches: result.matches,
          sequence: result.alignment().sequence(),
          mask: result.alignmentMask().sequence(),
          cover: result.alignmentCover().sequence()
        }
      });

      time.total = new Date().valueOf() - time.total;

      let data = {};
      data.results = alignResults;

      // show statistics, if asked for them
      if (stats) {
        data.stats = {
          length: {
            q: q.length,
            seq: seq.length
          },
          workers: workers,
          time: time
        }
      };

      // callback --- end function!
      return callback(null, data);

    }
  );

};
