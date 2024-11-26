# aiken_spending_validator

This showcase project contains 5 validators:

- `check_datum`
- `check_redeemer`
- `sc_wallet`
- `receipts`
- `cip_68`

Install `pnpm` if you have not by running `npm i -g pnpm`, and then go to [`offchain`](./offchain):

- Run `pnpm i` if you have never run the `offchain`
- Run `pnpm dev` to run the `offchain`

Open http://localhost:3000

## `check_datum`

In this spending validator, we see one way to work with `Option` using `when-is`.

See:

- `Option`: https://aiken-lang.org/language-tour/primitive-types#option
- `when-is`: https://aiken-lang.org/language-tour/custom-types#pattern-matching

## `check_redeemer`

Here, we see another way to work with `Option` using the `aiken/option.{or_else}` utility function.

See: https://aiken-lang.github.io/stdlib/aiken/option.html#or_else

## `sc_wallet`

With this validator, we see how we can provide a script parameter.

## `receipts`

This validator explores the concept of:

- **Receipts** as mentioned on the Aiken's **Common Design Patterns** page: https://aiken-lang.org/fundamentals/common-design-patterns#receipts
- **Transaction-level validation via minting-policies** by **AnastasiaLabs**: https://github.com/Anastasia-Labs/design-patterns/blob/main/transaction-level-validator-minting-policy/TRANSACTION-LEVEL-VALIDATION-MINTING-POLICY.md#transaction-level-validation-via-minting-policies

We see how these 2 concepts can be combined together.

## `cip_68`

This is our validator for the CIP-68 token minting and metadata updating.

See: https://developers.cardano.org/docs/governance/cardano-improvement-proposals/CIP-0068

The logic of this validator is somewhat arbitrary, the important concept of CIP-68 can be seen at the transaction building on the offchain code.
