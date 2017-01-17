# StdLib DNA Sequence Alignment - MapReduce Example

This is a [StdLib](https://stdlib.com) service to perform exhaustive, ungapped
DNA sequence alignment in a massively parallel fashion. It makes use of the
[NtSeq](https://github.com/keithwhor/NtSeq) Node.js package to perform alignment
and derive results.

You can find this service on [StdLib: keith/sequence](https://stdlib.com/services/keith/sequence),
or [GitHub: keithwhor/stdlib-sequence](https://github.com/keithwhor/stdlib-sequence).

## Example Query

You can provide any genome sequence you want with the `seq` parameter,
though by default the sequence is the first 1,000,000 nucleotides of the E.
coli K12 Genome.

```javascript
f('keith/sequence')({q: 'GATTACACAT', count: 2}, (err, result) => {

  // do something with result

});
```

Also available at https://keith.stdlib.com/sequence?q=GATTACACAT&count=2

Returns;

```json
{
  "results": [
    {
      "position": 474308,
      "sequence": "GATTACGCAT",
      "mask": "GATTAC-CAT",
      "cover": "GATTACRCAT"
    },
    {
      "position": 965004,
      "sequence": "GATTGCACAT",
      "mask": "GATT-CACAT",
      "cover": "GATTRCACAT"
    }
  ]
}
```

## Usage

You can use this service via HTTPS:

```
https://keith.stdlib.com/sequence?q=ATGC
```

Via the [StdLib CLI "f" command](https://github.com/poly/stdlib):

```
$ npm install lib -g
$ f keith/sequence --q ATGC
```

Or in a Node.js / Browser-based project using [the "f" package](https://github.com/poly/f):

```javascript
const f = require('f');

f('keith/sequence')({q: 'ATGC'}, (err, result) => {
  // handle result
});
```

## Service Parameters

This service accepts a few parameters;

`q`: Query sequence for alignment (what you're searching for)

`seq`: Genome sequence to search through

`count`: Number of results to return (default 1)

`repeat`: Repeats of query sequence (repeat query sequence this many times)

`stats`: Show search statistics

## Example Response

https://keith.stdlib.com/sequence?q=GATTACACAT&count=1&stats

```json
{
  "results": [
    {
      "position": 474308,
      "sequence": "GATTACGCAT",
      "mask": "GATTAC-CAT",
      "cover": "GATTACRCAT"
    }
  ],
  "stats": {
    "length": {
      "q": 10,
      "seq": 1000000
    },
    "workers": 0,
    "time": {
      "total": 1791,
      "prepare": 83,
      "map": 722,
      "reduce": 0,
      "sort": 986
    }
  }
}
```

`results` is an Array of results, order by number of matches.

`result.position` is the position of the matching sequence in the target genome.

`result.sequence` is the sequence of the match, beginning at `result.position`.

`result.mask` is the "sequence mask" from [NtSeq](https://github.com/keithwhor/NtSeq), i.e.
the "pessimistic" sequence that represents the intersection of both query and target sequences.

`result.cover` is the "sequence cover" from [NtSeq](https://github.com/keithwhor/NtSeq), i.e.
the "optimistic" sequence that represents the union of both query and target sequences.

`stats` is an Object showing general query statistics, will only be provided if
the `stats` query parameter is set.

`stats.length` shows the total function input length.

`stats.workers` shows the parallelization amount (0 means no workers were dispatched)

`stats.time` shows a breakdown of time (in ms) spent in each step

## MapReduce

To see an example of [StdLib](https://stdlib.com) MapReduce in action, simply
specify inputs that cause parallelization to occur (more than 1,000,000,000 nt²).

```
$ f keith/sequence --q A --repeat 10000 --count 0 --stats
```

https://keith.stdlib.com/sequence?q=A&repeat=10000&count=0&stats

```json
{
  "results": [],
  "stats": {
    "length": {
      "q": 10000,
      "seq": 1000000
    },
    "workers": 10,
    "time": {
      "total": 6497,
      "prepare": 47,
      "map": 5504,
      "reduce": 46,
      "sort": 900
    }
  }
}
```

## Deploy to StdLib, Build Your Own MapReduce Service

If you'd like to deploy a copy of this service on StdLib, use the [StdLib CLI tools](https://github.com/poly/stdlib);

```
$ npm install lib -g
$ lib init
$ lib up
```

Make sure to change `{"stdlib": {"name": "keith/sequence"}}` in `package.json`
to match your username and desired service name.

## That's it!

Thanks for checking this service out. I look forward to seeing other people
build out MapReduce example on StdLib. :)

You can [sign up for StdLib here](https://stdlib.com).

Check out [StdLib on GitHub](https://github.com/poly/stdlib).

Follow us on Twitter, [@polybit](https://twitter.com/polybit).

Or follow me specifically, [@keithwhor](https://twitter.com/keithwhor).

Happy Building!
