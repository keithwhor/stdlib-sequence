const Nt = require('ntseq');

module.exports = (params, callback) => {

  let q = (params.kwargs.q || '') + '';
  let seq = (params.kwargs.seq || '') + '';

  let offset = Math.max(0, parseInt(params.kwargs.offset) || 0);

  let readTime = new Date().valueOf();

  let query = new Nt.Seq().read(q);
  let sequence = new Nt.Seq().read(seq);

  readTime = new Date().valueOf() - readTime;

  // create the alignment map provided offset
  // initialize will actually perform "map" procedure
  let map = sequence.mapSequence(query, offset).initialize();

  map.__debug.readTime = readTime;

  return callback(null, {
    meta: map.__debug,
    data: map.results()
  });

};
