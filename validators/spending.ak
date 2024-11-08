use aiken/cbor
use aiken/collection/list
use aiken/crypto.{VerificationKeyHash}
use aiken/option
use aiken/primitive/bytearray
use cardano/address.{Script}
use cardano/assets.{PolicyId}
use cardano/transaction.{InlineDatum, Input, OutputReference, Transaction}
use modules/functions.{filter_map_script_inputs}
use modules/types.{Cip68}
use modules/value

validator check_datum {
  spend(
    datum: Option<Int>,
    _redeemer: Void,
    _o_ref: OutputReference,
    _tx: Transaction,
  ) {
    // one way to deal with Option is by using when-is to extract its value
    when datum is {
      Some(i) -> (i == 42)?
      None -> False
    }
  }

  else(_) {
    False
  }
}

validator check_redeemer {
  spend(
    datum: Option<ByteArray>,
    redeemer: ByteArray,
    _o_ref: OutputReference,
    _tx: Transaction,
  ) {
    // another way is by using aiken/option.{or_else} by providing a fallback/default value
    let hash = datum |> option.or_else("")
    (crypto.sha2_256(redeemer) == hash)?
  }

  else(_) {
    False
  }
}

validator sc_wallet(pkh: VerificationKeyHash) {
  spend(
    _datum: Option<Void>,
    _redeemer: Void,
    _o_ref: OutputReference,
    tx: Transaction,
  ) {
    // allow spending whenever the transaction is signed by the PKH as specified in the script param
    list.has(tx.extra_signatories, pkh)?
  }

  else(_) {
    False
  }
}

validator receipts(pkh: VerificationKeyHash) {
  /// Receipts:
  /// https://aiken-lang.org/fundamentals/common-design-patterns#receipts
  mint(_redeemer: Void, policy_id: PolicyId, tx: Transaction) {
    // transaction level validation
    expect tx.extra_signatories |> list.has(pkh)

    // must spend something from the contract address
    let script_inputs_o_ref_list =
      filter_map_script_inputs(
        tx.inputs,
        policy_id,
        fn(input) { input.output_reference },
      )
    expect script_inputs_o_ref_list != []

    // must mint the expected asset-name receipt-NFT with asset-qty == 1
    let asset_name =
      script_inputs_o_ref_list
        |> cbor.serialise
        |> crypto.blake2b_256
    (assets.quantity_of(tx.mint, policy_id, asset_name) == 1)?
  }

  /// Transaction Level Validation via Minting Policies:
  /// https://github.com/Anastasia-Labs/design-patterns/blob/main/transaction-level-validator-minting-policy/TRANSACTION-LEVEL-VALIDATION-MINTING-POLICY.md#transaction-level-validation-via-minting-policies
  spend(
    _datum: Option<Void>,
    _redeemer: Void,
    o_ref: OutputReference,
    tx: Transaction,
  ) {
    // delegate the validations to the minting script, which will only be executed once for the entire transaction
    expect Some(input) = tx.inputs |> transaction.find_input(o_ref)
    when input.output.address.payment_credential is {
      Script(policy_id) -> (assets.policies(tx.mint) == [policy_id])?
      _ -> False
    }
  }

  else(_) {
    False
  }
}

/// CIP-68:
/// https://developers.cardano.org/docs/governance/cardano-improvement-proposals/CIP-0068
validator cip_68 {
  mint(_redeemer: Void, policy_id: PolicyId, tx: Transaction) {
    // must mint exactly 2 tokens: ref_token & usr_token
    expect [ref_token, usr_token] = tx.mint |> value.to_pairs(policy_id)

    // must mint 1 ref_token, labelled:000643b0
    expect Pair(ref_token_name, 1) = ref_token
    expect #"000643b0" = ref_token_name |> bytearray.take(4)

    // must send ref_token to self_script with CIP-68 inline datum
    expect [ref_token_utxo] =
      tx.outputs |> transaction.find_script_outputs(policy_id)
    expect InlineDatum(metadata) = ref_token_utxo.datum
    expect _: Cip68 = metadata
    expect 1 =
      ref_token_utxo.value |> assets.quantity_of(policy_id, ref_token_name)

    // must mint usr_token with the same name as the ref_token
    let Pair(usr_token_name, _) = usr_token
    bytearray.drop(usr_token_name, 4) == bytearray.drop(ref_token_name, 4)
  }

  spend(
    _datum: Option<Cip68>,
    _redeemer: Void,
    o_ref: OutputReference,
    tx: Transaction,
  ) {
    // must consume usr_token to proof ownership
    expect Some(input) = tx.inputs |> transaction.find_input(o_ref)
    expect Script(policy_id) = input.output.address.payment_credential
    expect [Pair(ref_token_name, _)] =
      input.output.value |> value.to_pairs(policy_id)
    let token_name = ref_token_name |> bytearray.drop(4)
    expect {
      let input <- list.any(tx.inputs)
      let tokens = input.output.value |> value.to_pairs(policy_id)
      let Pair(asset_name, _) <- list.any(tokens)
      and {
        asset_name != ref_token_name,
        bytearray.drop(asset_name, 4) == token_name,
      }
    }

    // must resend ref_token to update the metadatum
    expect [output] = tx.outputs |> transaction.find_script_outputs(policy_id)
    expect InlineDatum(metadata) = output.datum
    expect _: Cip68 = metadata
    expect [Pair(o_ref_token_name, _)] =
      output.value |> value.to_pairs(policy_id)
    and {
      o_ref_token_name == ref_token_name,
      output.reference_script == input.output.reference_script,
    }
  }

  else(_) {
    False
  }
}
