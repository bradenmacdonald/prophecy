Prophecy is a JavaScript library for modelling budgets and account transaction data.
It is used to power [Ratio](https://www.ratiobudget.com/).

Budgeting features:
* Multi-currency support
* Transactions model actual or predicted/future account transactions
* Transactions can include arbitrary metadata defined by the user
* Categories define budgets like "$15/day for lunch" with a lot of flexibility
* Categories can include arbitrary metadata defined by the user

API features:
* Only one dependency, [Immutable.js](https://facebook.github.io/immutable-js/)
* Fully immutable API.
* Can be used as a [Redux](https://github.com/rackt/redux) state
* Includes a redux reducer and complete action API
* Redux actions can be "inverted" for powerful undo/redo functionality.
* Full test suite
* Easy serialization to/from JSON

Prophecy is available on NPM as [`prophecy-engine`](https://www.npmjs.com/package/prophecy-engine).
