import * as siteConfig from "@/config/site";

import { Accordion, AccordionItem } from "@nextui-org/accordion";

import { ActionGroup } from "@/types/action";
import CheckDatum from "./actions/A_CheckDatum";
import CheckRedeemer from "./actions/B_CheckRedeemer";
import ScWallet from "./actions/C_ScWallet";
import Receipts from "./actions/D_Receipts";
import Cip68 from "./actions/E_Cip68";

import { createHash } from "crypto";
import { blake2bHex } from "blakejs";
import {
  Address,
  applyDoubleCborEncoding,
  applyParamsToScript,
  Constr,
  Data,
  fromHex,
  fromText,
  Lovelace,
  LucidEvolution,
  MintingPolicy,
  mintingPolicyToId,
  paymentCredentialOf,
  SpendingValidator,
  toUnit,
  TxBuilder,
  TxSignBuilder,
  Validator,
  validatorToAddress,
} from "@lucid-evolution/lucid";

const Script = {
  SpendCheckDatum: applyDoubleCborEncoding(
    "59010801010032323232323232323225333003323232323253330083370e900118051baa001132332253333330120051533300b3370e900018069baa0051533300f300e375400a2a66601666e1d2000300d37540022a66601666e1cdd6980818071baa001481505288a9980624810f69203d3d203432203f2046616c73650014a02a66018921084e6f20446174756d001600a00a00a00a00a00a300e001300e300f001300b37540022c6018601a006601600460140046014002600c6ea8004526153300449011856616c696461746f722072657475726e65642066616c73650013656153300249010f5f72656465656d65723a20566f696400165734ae7155ceaab9e5573eae855d12ba41"
  ),

  SpendCheckRedeemer: applyDoubleCborEncoding(
    "58ff010100323232323232323225333003323232323253330083370e900118051baa0011323322533333301100500a00a00a00a1533300b3371e6e48dd7002a99980599b8748008c034dd50008a441001375c601e601c6ea80045288a9980624812963727970746f2e736861325f3235362872656465656d657229203d3d2068617368203f2046616c73650014a0601a002601a601c00260166ea800458c02cc03000cc028008c024008c024004c018dd50008a4c2a6600892011856616c696461746f722072657475726e65642066616c73650013656153300249011372656465656d65723a2042797465417272617900165734ae7155ceaab9e5742ae895d201"
  ),

  SpendScWallet: applyDoubleCborEncoding(
    "59011e01010032323232323232323232232253330053232323232533300a3370e900118061baa001132332253333330150051533300d3370e900018079baa005153330113010375400a2a66601a66ebcdd3998091ba900a4bd701809980a180a180a180a180a180a180a180a18081baa00614a22a6601c9201255b706b685d203d3d2074782e65787472615f7369676e61746f72696573203f2046616c73650014a0018018018018018018602200260226024002601a6ea800458c03cc04000cc038008c034008c034004c020dd50008a4c2a6600c92011856616c696461746f722072657475726e65642066616c73650013656375c0022a660049210f5f72656465656d65723a20566f696400165734ae7155ceaab9e5573eae815d0aba257481"
  ),

  Receipts: applyDoubleCborEncoding(
    "590485010100323232323232323232322322533300532323232323232323253232323330113003007132533333301a00a153330123004301437540142a66602c602a6ea802854ccc048cdd79ba733017375201e97ae030183019301930193019301930193019301930153754016264a66602666602666ebd3001018000374e0029412889919299980c8008010a99980c980e000899299980b18039bad301900113371e6eb8c060004dca1bb3374e008006603600200464a66602a600c602e6ea800452f5bded8c026eacc06cc060dd500099198008009bab300a3018375401c44a6660340022980103d87a8000132333222533301a337220120062a66603466e3c02400c4c028cc07cdd300125eb80530103d87a8000133006006001375c60320026eacc068004c078008c07000454cc0512410c496e76616c6964204d696e740016153301449125657870656374205b5d20213d207363726970745f696e707574735f6f5f7265665f6c697374001632330010013758600e602c6ea8030894ccc06000452f5c02664464a66602e601060326ea80044cc0140140084cc070c074c068dd50009980280280119299980b9804180c9baa001153330173371e6eb8c074c068dd5000803098039980e1805980d1baa0034bd700a60103d87a800014c103d87a8000300a30193754601460326ea8c024c064dd5001180d000980d8008a99809a4924657870656374205b706b685d203d3d2074782e65787472615f7369676e61746f726965730016011011011011011011375c602e60286ea802054ccc044c00801c4c8cc894cccccc07003054ccc050c018c058dd50060a99980c180b9baa00c1325333015300730173754002264a66602c600e60306ea800454ccc058cdd79ba732330010013756601860346ea8040894ccc07000452f5c026603a6034603c00266004004603e0026e9ccc06cc070c064dd5000a5eb805288a9980ba492f6173736574732e706f6c69636965732874782e6d696e7429203d3d205b706f6c6963795f69645d203f2046616c73650014a02a6602e921426578706563742053637269707428706f6c6963795f696429203d20696e7075742e6f75747075742e616464726573732e7061796d656e745f63726564656e7469616c0016300930183754601260306ea8c020c060dd5180d980c1baa00115330164913f65787065637420536f6d6528696e70757429203d2074782e696e70757473207c3e207472616e73616374696f6e2e66696e645f696e707574286f5f72656629001632330010013758601260306ea8038894ccc0680045300103d87a80001332253330183375e601860366ea80080184c020cc0740092f5c02660080080026038002603a00202602602602602602660300026030603200260286ea802058dd2a40006e1d2002370e90001180a180a8009180980091809180998099809980980098061baa001300f3010003300e002300d002300d001300837540022930a9980324811856616c696461746f722072657475726e65642066616c73650013656375c0022a660049210f5f72656465656d65723a20566f696400165734ae7155ceaab9e5573eae815d0aba257481"
  ),

  Cip68: applyDoubleCborEncoding(
    "590b5f01010032323232323232323232323232323232253330093232323232323232323232323232323232533301a300900c132533333302300f1533301b300a301d375401e2a66603e603c6ea803c4c94ccc0800040684c8c94ccc0880040704c94ccc08cc0980084c94ccc080c030dd698118020a99981019b8f488104000643b000333718900024010002264a66604a002040264a66604c6052004264a66604666e1d200430253754002264a66666605800226660240022a666048602064a66604a6022604e6ea8004520001375a605660506ea8004c94ccc094c044c09cdd50008a60103d87a8000132330010013756605860526ea8008894ccc0ac004530103d87a8000132333222533302b337220180062a66605666e3c03000c4c050cc0c0dd400125eb80530103d87a8000133006006001375c60540026eb4c0ac004c0bc008c0b4004cc030dd5980a18139baa00300a13371e6602a6eb8c0980192008330150054802054cc0952401566578706563742031203d0a2020202020207265665f746f6b656e5f7574786f2e76616c7565207c3e206173736574732e7175616e746974795f6f6628706f6c6963795f69642c207265665f746f6b656e5f6e616d652900160200200200200203029302637540022a660489213365787065637420496e6c696e65446174756d286d6574616461746129203d207265665f746f6b656e5f7574786f2e646174756d0016300c30253754002042604e002660166eb0c028c08cdd500a8030a99810a48138657870656374202322303030363433623022203d207265665f746f6b656e5f6e616d65207c3e206279746561727261792e74616b65283429001615330214912a6578706563742050616972287265665f746f6b656e5f6e616d652c203129203d207265665f746f6b656e0016375c604200603a604800260480046044002660046eacc084c088c088c088c088c078dd500800080a00a00a00a00a00a1bae3020301d375401a2a666034600c0182646644a66666604a0222a66603a6018603e6ea804454ccc084c080dd5008899299980f180698101baa001132325333020300c3022375400226464a66604c002038264a66604e605400426464a66604a64660020026eb0c04cc0a4dd500d9129998158008a5013322533302932330010013301137566034605a6ea8c068c0b4dd50018051129998178008a5013322533302d32533302e33302e3371e00201694128899b8f3301f001480200285281bae302f00214a22660080080026062002606400229444cc010010004c0b4004c0b80044c94ccc0a80040844c94ccc0acc0b80084c94ccc0a0cdc3a400860546ea80044c94cccccc0c40044ccc05c0044c94ccc0b800409c4c94ccc0bcc0c800854ccc0accdc79bae302d0010081533302b3375e6030605c6ea8014c060c0b8dd5180d98171baa00d1323375e6002605e6ea8018c004c0bcdd5180e18179baa00e2303230333033303300114a029400a0c0c0004cc040dd5980c98161baa003009025025025025025302e302b37540022a6605292012b65787065637420496e6c696e65446174756d286d6574616461746129203d206f75747075742e646174756d00163011302a37540020446058002660206eb0c03cc0a0dd500d0028a998132481ff657870656374207b0a2020202020206c657420696e707574203c2d206c6973742e616e792874782e696e70757473290a2020202020206c657420746f6b656e73203d20696e7075742e6f75747075742e76616c7565207c3e2076616c75652e746f5f706169727328706f6c6963795f6964290a2020202020206c657420506169722861737365745f6e616d652c205f29203c2d206c6973742e616e7928746f6b656e73290a202020202020616e64207b0a202020202020202061737365745f6e616d6520213d207265665f746f6b656e5f6e616d652c0a20202020202020206279746561727261792e64726f702861737365745f6e616d652c203429203d3d1a20746f6b656e5f6e616d652c0a2020202020207d0a202020207d00163301500148020dd7181280080e9814000998041bab301130243754602260486ea800c004dd7181318119baa0011533021491426578706563742053637269707428706f6c6963795f696429203d20696e7075742e6f75747075742e616464726573732e7061796d656e745f63726564656e7469616c0016300c30223754601860446ea8c03cc088dd5000981218109baa001153301f49013f65787065637420536f6d6528696e70757429203d2074782e696e70757473207c3e207472616e73616374696f6e2e66696e645f696e707574286f5f72656629001632330010013758601660426ea804c894ccc08c0045300103d87a80001332253330213375e601c60486ea80080184c028cc0980092f5c0266008008002604a002604c00202c02c02c02c02c02c604200260426044002603a6ea80345888c94ccc070c020c078dd50008a5eb7bdb1804dd59811180f9baa0013300300200122323300100100322533302000114c103d87a800013233322253330203372200e0062a66604066e3c01c00c4c024cc094dd300125eb80530103d87a8000133006006001375c603e0026eacc080004c090008c088004dd2a40004603a603c603c00244646600200200644a66603a002297ae013322533301b32533301c3008301e3754002266e3c018dd71811180f9baa00114a06010603c6ea8c020c078dd500109981000119802002000899802002000980f80098100009b87480088c0680048894ccc054c010c05cdd5001899299980d000801099299999980f80080189919299980e8008028992999999811000803003003099192999810000804099299981098120010991980080080391192999812001006899192999999815000807007007007099191802981580318130019bae00130230013026002300200200930220013022003375a00200c603e002603e0066eac00400c00c00cc070004c060dd50018009b87480008c05cc06000488ccdc600099b81371a00400200460206ea8004c04cc05000cc048008c044008c044004c030dd50008a4c2a6601492011856616c696461746f722072657475726e65642066616c73650013656153300849010f5f72656465656d65723a20566f69640016153300749198657870656374205b50616972287265665f746f6b656e5f6e616d652c205f295d203d0a2020202020202f2f20657874726163742074686520696e707574207265665f746f6b656e2041737365744e616d652062792073656c6620506f6c69637949440a202020202020696e7075742e6f75747075742e76616c7565207c3e2076616c75652e746f5f706169727328706f6c6963795f696429001615330064914a657870656374205b6f75747075745d203d2074782e6f757470757473207c3e207472616e73616374696f6e2e66696e645f7363726970745f6f75747075747328706f6c6963795f696429001615330054911a657870656374205f3a204369703638203d206d657461646174610016153300449195657870656374205b50616972286f5f7265665f746f6b656e5f6e616d652c205f295d203d0a2020202020202f2f206578747261637420746865206f7574707574207265665f746f6b656e2041737365744e616d652062792073656c6620506f6c69637949440a2020202020206f75747075742e76616c7565207c3e2076616c75652e746f5f706169727328706f6c6963795f6964290016153300349144657870656374205b7265665f746f6b656e2c207573725f746f6b656e5d203d2074782e6d696e74207c3e2076616c75652e746f5f706169727328706f6c6963795f6964290016153300249158657870656374205b7265665f746f6b656e5f7574786f5d203d0a20202020202074782e6f757470757473207c3e207472616e73616374696f6e2e66696e645f7363726970745f6f75747075747328706f6c6963795f69642900165734ae7155ceaab9e5573eae815d0aba257481"
  ),
};

export default function Dashboard(props: {
  lucid: LucidEvolution;
  address: Address;
  setActionResult: (result: string) => void;
  onError: (error: any) => void;
}) {
  const { lucid, address, setActionResult, onError } = props;

  async function submitTx(tx: TxSignBuilder) {
    const txSigned = await tx.sign.withWallet().complete();
    const txHash = await txSigned.submit();

    return txHash;
  }

  function splitOutputs(txBuilder: TxBuilder, contractAddress: Address, inlineDatum: string, lovelace: Lovelace, splitCount: number) {
    const minAmount = 2_000000n;
    let splitAmount = lovelace / BigInt(splitCount);
    if (splitAmount < minAmount) splitAmount = minAmount;

    while (lovelace > splitAmount) {
      txBuilder = txBuilder.pay.ToContract(contractAddress, { kind: "inline", value: inlineDatum }, { lovelace: splitAmount });
      lovelace -= splitAmount;
    }

    txBuilder = txBuilder.pay.ToContract(contractAddress, { kind: "inline", value: inlineDatum }, { lovelace });
    return txBuilder;
  }

  const actions: Record<string, ActionGroup> = {
    CheckDatum: {
      deposit: async (lovelace: Lovelace) => {
        try {
          const spendingValidator: SpendingValidator = { type: "PlutusV3", script: Script.SpendCheckDatum };
          const validatorAddress = validatorToAddress(siteConfig.network, spendingValidator);

          const datum = Data.to(42n);

          let newTx = lucid.newTx();
          newTx = splitOutputs(newTx, validatorAddress, datum, lovelace, 100);

          const tx = await newTx.complete();

          submitTx(tx).then(setActionResult).catch(onError);
        } catch (error) {
          onError(error);
        }
      },

      withdraw: async () => {
        try {
          const spendingValidator: SpendingValidator = { type: "PlutusV3", script: Script.SpendCheckDatum };
          const validatorAddress = validatorToAddress(siteConfig.network, spendingValidator);

          const utxos = await lucid.utxosAt(validatorAddress);
          const redeemer = Data.void();

          const tx = await lucid.newTx().collectFrom(utxos, redeemer).attach.SpendingValidator(spendingValidator).complete();

          submitTx(tx).then(setActionResult).catch(onError);
        } catch (error) {
          onError(error);
        }
      },
    },

    CheckRedeemer: {
      deposit: async ({ lovelace, secret }: { lovelace: Lovelace; secret: string }) => {
        try {
          const spendingValidator: SpendingValidator = { type: "PlutusV3", script: Script.SpendCheckRedeemer };
          const validatorAddress = validatorToAddress(siteConfig.network, spendingValidator);

          const hash = createHash("sha256").update(secret, "utf8").digest("hex");
          const datum = Data.to(hash);

          let newTx = lucid.newTx();
          newTx = splitOutputs(newTx, validatorAddress, datum, lovelace, 75);

          const tx = await newTx.complete();

          submitTx(tx).then(setActionResult).catch(onError);
        } catch (error) {
          onError(error);
        }
      },

      withdraw: async (secret: string) => {
        try {
          const spendingValidator: SpendingValidator = { type: "PlutusV3", script: Script.SpendCheckRedeemer };
          const validatorAddress = validatorToAddress(siteConfig.network, spendingValidator);

          const hash = createHash("sha256").update(secret, "utf8").digest("hex");
          const utxos = (await lucid.utxosAt(validatorAddress)).filter(({ datum }) => datum && `${Data.from(datum, Data.Bytes())}` === hash);

          const hex = fromText(secret);
          const redeemer = Data.to(hex);

          const tx = await lucid.newTx().collectFrom(utxos, redeemer).attach.SpendingValidator(spendingValidator).complete();

          submitTx(tx).then(setActionResult).catch(onError);
        } catch (error) {
          onError(error);
        }
      },
    },

    ScWallet: {
      deposit: async (lovelace: Lovelace) => {
        try {
          const pkh = paymentCredentialOf(address).hash;
          const spendingScript = applyParamsToScript(Script.SpendScWallet, [pkh]);
          const spendingValidator: SpendingValidator = { type: "PlutusV3", script: spendingScript };
          const validatorAddress = validatorToAddress(siteConfig.network, spendingValidator);

          const datum = Data.void();

          let newTx = lucid.newTx();
          newTx = splitOutputs(newTx, validatorAddress, datum, lovelace, 50);

          const tx = await newTx.complete();

          submitTx(tx).then(setActionResult).catch(onError);
        } catch (error) {
          onError(error);
        }
      },

      withdraw: async () => {
        try {
          const pkh = paymentCredentialOf(address).hash;
          const spendingScript = applyParamsToScript(Script.SpendScWallet, [pkh]);
          const spendingValidator: SpendingValidator = { type: "PlutusV3", script: spendingScript };
          const validatorAddress = validatorToAddress(siteConfig.network, spendingValidator);

          const utxos = await lucid.utxosAt(validatorAddress);
          const redeemer = Data.void();

          const tx = await lucid.newTx().collectFrom(utxos, redeemer).attach.SpendingValidator(spendingValidator).addSigner(address).complete();

          submitTx(tx).then(setActionResult).catch(onError);
        } catch (error) {
          onError(error);
        }
      },
    },

    Receipts: {
      deposit: async (lovelace: Lovelace) => {
        try {
          const pkh = paymentCredentialOf(address).hash;

          const receiptScript = applyParamsToScript(Script.Receipts, [pkh]);
          const receiptValidator: SpendingValidator = { type: "PlutusV3", script: receiptScript };

          const validatorAddress = validatorToAddress(siteConfig.network, receiptValidator);

          const datum = Data.void();

          let newTx = lucid.newTx();
          newTx = splitOutputs(newTx, validatorAddress, datum, lovelace, 25);

          const tx = await newTx.complete();

          submitTx(tx).then(setActionResult).catch(onError);
        } catch (error) {
          onError(error);
        }
      },

      withdraw: async () => {
        try {
          const pkh = paymentCredentialOf(address).hash;

          const receiptScript = applyParamsToScript(Script.Receipts, [pkh]);
          const receiptValidator: Validator = { type: "PlutusV3", script: receiptScript };

          const validatorAddress = validatorToAddress(siteConfig.network, receiptValidator);
          const policyID = mintingPolicyToId(receiptValidator);

          const utxos = await lucid.utxosAt(validatorAddress);
          const redeemer = Data.void();

          const oRefs = utxos.map(({ txHash, outputIndex }) => {
            return new Constr(0, [String(txHash), BigInt(outputIndex)]);
          });
          const oRefsCBOR = Data.to(oRefs);

          const assetName = blake2bHex(fromHex(oRefsCBOR), undefined, 32);
          const mintedAssets = { [`${policyID}${assetName}`]: 1n };

          const tx = await lucid
            .newTx()
            .collectFrom(utxos, redeemer)
            .attach.SpendingValidator(receiptValidator)
            .mintAssets(mintedAssets, redeemer)
            .attach.MintingPolicy(receiptValidator)
            .addSigner(address)
            .complete();

          submitTx(tx).then(setActionResult).catch(onError);
        } catch (error) {
          onError(error);
        }
      },
    },

    Cip68: {
      mint: async ({ name, image, label, qty }: { name: string; image: string; label: 222 | 333 | 444; qty: number }) => {
        try {
          if (name.length > 32) throw "Asset Name is too long!";
          if (image.length > 64) throw "Asset Image URL is too long!";

          const metadata = Data.fromJson({ name, image });
          const version = BigInt(1);
          const extra: Data[] = [];
          const cip68 = new Constr(0, [metadata, version, extra]);

          const datum = Data.to(cip68);
          const redeemer = Data.void();

          const spendingValidator: SpendingValidator = { type: "PlutusV3", script: Script.Cip68 };
          const validatorAddress = validatorToAddress(siteConfig.network, spendingValidator);

          const mintingPolicy: MintingPolicy = { type: "PlutusV3", script: Script.Cip68 };
          const policyID = mintingPolicyToId(mintingPolicy);

          const assetName = fromText(name);

          const refUnit = toUnit(policyID, assetName, 100);
          const usrUnit = toUnit(policyID, assetName, label);

          localStorage.setItem("refUnit", refUnit);
          localStorage.setItem("usrUnit", usrUnit);

          //   //#region Validate Minting
          //   const refTokenUTXOs = await lucid.utxosAtWithUnit(validatorAddress, refUnit);
          //   if (refTokenUTXOs.length) throw "Must NOT ReMint RefTokens";
          //   //#endregion

          const tx = await lucid
            .newTx()
            .mintAssets(
              {
                [refUnit]: 1n,
                [usrUnit]: BigInt(qty),
              },
              redeemer
            )
            .attach.MintingPolicy(mintingPolicy)
            .pay.ToContract(
              validatorAddress,
              { kind: "inline", value: datum },
              {
                [refUnit]: 1n,
              }
            )
            .complete();

          submitTx(tx).then(setActionResult).catch(onError);
        } catch (error) {
          onError(error);
        }
      },

      update: async ({ name, image }: { name: string; image: string }) => {
        try {
          if (name.length > 32) throw "Asset Name is too long!";
          if (image.length > 64) throw "Asset Image URL is too long!";

          const metadata = Data.fromJson({ name, image });
          const version = BigInt(1);
          const extra: Data[] = [];
          const cip68 = new Constr(0, [metadata, version, extra]);

          const datum = Data.to(cip68);
          const redeemer = Data.void();

          const spendingValidator: SpendingValidator = { type: "PlutusV3", script: Script.Cip68 };
          const validatorAddress = validatorToAddress(siteConfig.network, spendingValidator);

          const refUnit = localStorage.getItem("refUnit");
          const usrUnit = localStorage.getItem("usrUnit");

          if (!refUnit || !usrUnit) throw "Found no asset units in the current session's local storage. Must mint first!";

          const refTokenUTXOs = await lucid.utxosAtWithUnit(validatorAddress, refUnit);
          const usrTokenUTXOs = await lucid.utxosAtWithUnit(address, usrUnit);

          const tx = await lucid
            .newTx()
            .collectFrom([...refTokenUTXOs, ...usrTokenUTXOs], redeemer)
            .attach.SpendingValidator(spendingValidator)
            .pay.ToContract(
              validatorAddress,
              { kind: "inline", value: datum },
              {
                [refUnit]: 1n,
              }
            )
            .complete();

          submitTx(tx).then(setActionResult).catch(onError);
        } catch (error) {
          onError(error);
        }
      },
    },
  };

  return (
    <div className="flex flex-col gap-2">
      <span>{address}</span>

      <Accordion variant="splitted">
        {/* Check Datum */}
        <AccordionItem key="1" aria-label="Accordion 1" title="Check Datum">
          <CheckDatum onDeposit={actions.CheckDatum.deposit} onWithdraw={actions.CheckDatum.withdraw} />
        </AccordionItem>

        {/* Check Redeemer */}
        <AccordionItem key="2" aria-label="Accordion 2" title="Check Redeemer">
          <CheckRedeemer onDeposit={actions.CheckRedeemer.deposit} onWithdraw={actions.CheckRedeemer.withdraw} />
        </AccordionItem>

        {/* SC Wallet */}
        <AccordionItem key="3" aria-label="Accordion 3" title="SC Wallet">
          <ScWallet onDeposit={actions.ScWallet.deposit} onWithdraw={actions.ScWallet.withdraw} />
        </AccordionItem>

        {/* Receipts */}
        <AccordionItem key="4" aria-label="Accordion 4" title="Receipts">
          <Receipts onDeposit={actions.Receipts.deposit} onWithdraw={actions.Receipts.withdraw} />
        </AccordionItem>

        {/* CIP-68 */}
        <AccordionItem key="5" aria-label="Accordion 5" title="CIP-68">
          <Cip68 onMint={actions.Cip68.mint} onUpdate={actions.Cip68.update} />
        </AccordionItem>
      </Accordion>
    </div>
  );
}
