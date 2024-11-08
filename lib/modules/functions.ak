use aiken/collection/list
use aiken/crypto.{ScriptHash}
use cardano/address.{Script}
use cardano/transaction.{Input}

pub fn filter_map_script_inputs(
  inputs: List<Input>,
  script_hash: ScriptHash,
  map_to: fn(Input) -> result,
) -> List<result> {
  let input <- list.filter_map(inputs)
  when input.output.address.payment_credential is {
    Script(hash) ->
      if hash == script_hash {
        input |> map_to |> Some
      } else {
        None
      }
    _ -> None
  }
}
