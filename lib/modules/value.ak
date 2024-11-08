use aiken/collection/dict
use cardano/assets.{AssetName, PolicyId, Value}

pub fn to_pairs(value: Value, policy_id: PolicyId) -> Pairs<AssetName, Int> {
  value
    |> assets.tokens(policy_id)
    |> dict.to_pairs
}
