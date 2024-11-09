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
  validatorToAddress,
} from "@lucid-evolution/lucid";

const Script = {
  SpendCheckDatum: applyDoubleCborEncoding(
    "58fa01010032323232323232323225333003323232323253330083370e900118051baa001132323253333330120051533300b3370e900018069baa0051533300f300e375400a2a66601666e1d2000300d37540022a66601666e1cdd6980818071baa001481505288a9980624810f69203d3d203432203f2046616c73650014a02940028028028028028028c03cc040008c038004c02cdd50008b1806180680118058009805801180480098031baa001149854cc01124011856616c696461746f722072657475726e65642066616c73650013656153300249010f5f72656465656d65723a20566f696400165734ae7155ceaab9e5573eae855d12ba41"
  ),

  SpendCheckRedeemer: applyDoubleCborEncoding(
    "590101010100323232323232323225333003323232323253330083370e900118051baa0011323232533333301100500a00a00a00a132533300c3371e6e480054ccc030cdc3a4004601c6ea80085221001375c6020601e6ea80085288a99806a4812963727970746f2e736861325f3235362872656465656d657229203d3d2068617368203f2046616c73650014a06eb8014c038c03c008c034004c02cdd50008b1805980600118050009805001180400098031baa001149854cc0112411856616c696461746f722072657475726e65642066616c73650013656153300249011372656465656d65723a2042797465417272617900165734ae7155ceaab9e5742ae895d201"
  ),

  SpendScWallet: applyDoubleCborEncoding(
    "59013c010100323232323232323232232253330053232323232533300a3370e900118061baa001132323253333330140051533300d3370e900018079baa005153330113010375400a2a66601a64660020026eb0c04cc050c050c050c050c050c050c050c050c044dd50041129998098008a5013253330103371e6eb8c054008034528899801801800980a8008a51153300e4912b6c6973742e6861732874782e65787472615f7369676e61746f726965732c20706b6829203f2046616c73650014a0018018018018018018602260240046020002601a6ea800458c038c03c008c034004c034008c02c004c020dd50008a4c2a6600c92011856616c696461746f722072657475726e65642066616c73650013656375c0022a660049210f5f72656465656d65723a20566f696400165734ae7155ceaab9e5573eae855d12ba41"
  ),

  Receipts: applyDoubleCborEncoding(
    "5904e4010100323232323232323232322322533300532323232323232323253232323330113003007132533333301a00a153330123004301437540142a66602c602a6ea802854ccc048c8cc004004dd6180c980d180d180d180d180d180d180d180d180b1baa00d22533301800114a0264a66602a66e3cdd7180d8010090a51133003003001301b00113253330133330133375e6e9c00530010180004a094454ccc04cc010cc88c94ccc058c01cc060dd50008a400026eb4c070c064dd500099299980b1803980c1baa00114c103d87a8000132330010013756603a60346ea8008894ccc070004530103d87a8000132323232533301c337220100042a66603866e3c0200084c030cc084dd4000a5eb80530103d87a8000133006006003375a603c0066eb8c070008c080008c078004c8cc00400400c894ccc06c0045300103d87a8000132323232533301b337220140042a66603666e3c0280084c02ccc080dd3000a5eb80530103d87a80001330060060033756603a0066eb8c06c008c07c008c074004dd59804180b1baa00d3237280026eccdd38008a51153301449013f6173736574732e7175616e746974795f6f662874782e6d696e742c20706f6c6963795f69642c2061737365745f6e616d6529203d3d2031203f2046616c73650014a02a6602892125657870656374207363726970745f696e707574735f6f5f7265665f6c69737420213d205b5d001632330010013758600e602c6ea8034894ccc06000452f5c026464a66602c600e60306ea80044cc0100100084cc06cc070c064dd5000998020020011919299980b9804180c9baa001153330173371e6eb8c074c068dd5000803098039980e1805980d1baa0024bd700a60103d87a800014c103d87a8000300a30193754601460326ea8c024c064dd5000980d801180d8008a99809a492c6578706563742074782e65787472615f7369676e61746f72696573207c3e206c6973742e68617328706b68290016011011011011011011375c602e60286ea802054ccc044c00801c4c8c8c94cccccc07003054ccc050c018c058dd50060a99980c180b9baa00c1325333015300730173754002264a66602c600e60306ea800454ccc058cdd79ba732330010013756601860346ea8044894ccc07000452f5c026603a6034603c00266004004603e0026e9ccc06cc070c064dd5000a5eb805288a9980ba492f6173736574732e706f6c69636965732874782e6d696e7429203d3d205b706f6c6963795f69645d203f2046616c73650014a02940c024c060dd51804980c1baa300830183754603660306ea800454cc0592413f65787065637420536f6d6528696e70757429203d2074782e696e70757473207c3e207472616e73616374696f6e2e66696e645f696e707574286f5f72656629001632330010013758601260306ea803c894ccc0680045300103d87a80001323253330183375e601860366ea80080184c020cc0740092f5c0266008008002603c004603800202602602602602602660326034004603000260286ea802058dd2a40006e1d2002370e90001180a180a8009180980091809180998099809980980098061baa001300f3010002300e001300e002300c001300837540022930a9980324811856616c696461746f722072657475726e65642066616c73650013656375c0022a660049210f5f72656465656d65723a20566f696400165734ae7155ceaab9e5573eae815d0aba257481"
  ),

  Cip68: applyDoubleCborEncoding(
    "590abd01010032323232323232323232323232323232253330093232323232323232323232323232323232533301a300900c132533333302300f1533301b300a301d375401e2a66603e603c6ea803c4c94ccc0800040584c8c94ccc0880040604c94ccc08cc0980084c94ccc080c030dd698118020a99981019b8f488104000643b000333718900024010002264a66604a002038264a66604c6052004264a66604666e1d200430253754002264a66666605800226660240022a666048602064a66604a6022604e6ea8004520001375a605660506ea8004c94ccc094c044c09cdd50008a60103d87a8000132330010013756605860526ea8008894ccc0ac004530103d87a8000132323232533302b337220180042a66605666e3c0300084c050cc0c0dd4000a5eb80530103d87a8000133006006003375a605a0066eb8c0ac008c0bc008c0b4004cc030dd5980a18139baa00300a13371e6602a6eb8c0980192008330150054802054cc0952401566578706563742031203d0a2020202020207265665f746f6b656e5f7574786f2e76616c7565207c3e206173736574732e7175616e746974795f6f6628706f6c6963795f69642c207265665f746f6b656e5f6e616d652900160200200200200203029302637540022a660489213365787065637420496e6c696e65446174756d286d6574616461746129203d207265665f746f6b656e5f7574786f2e646174756d0016300c3025375400203a604e002660166eb0c028c08cdd500b0030a99810a48138657870656374202322303030363433623022203d207265665f746f6b656e5f6e616d65207c3e206279746561727261792e74616b65283429001615330214912a6578706563742050616972287265665f746f6b656e5f6e616d652c203129203d207265665f746f6b656e0016375c6042006032604800260480046044002660046eacc084c088c088c088c088c078dd500880080a00a00a00a00a00a1bae3020301d375401a2a666034600c0182646464a66666604a0222a66603a6018603e6ea804454ccc084c080dd5008899299980f180698101baa001132325333020300c3022375400226464a66604c00203e264a66604e605400426464a66604a64660020026eb0c04cc0a4dd500e1129998158008a5013253330283233001001330103756603260586ea8c064c0b0dd518178018049129998170008a50132533302b32533302c33302c3371e00201294128899b8f3301d001480200205281bae302d303100214a2266006006002606200229444cc00c00c004c0b80044c94ccc0a80040904c94ccc0acc0b80084c94ccc0a0cdc3a400860546ea80044c94cccccc0c40044ccc05c0044c94ccc0b80040a44c94ccc0bcc0c800854ccc0accdc79bae302d0010081323375e6002605e6ea8018c004c0bcdd5180e18179baa00e2303230333033303300114a00546060002660206eacc064c0b0dd5001804812812812812812981718159baa001153302949012b65787065637420496e6c696e65446174756d286d6574616461746129203d206f75747075742e646174756d00163011302a375400204a6058002660206eb0c03cc0a0dd500d8028a998132481ff657870656374207b0a2020202020206c657420696e707574203c2d206c6973742e616e792874782e696e70757473290a2020202020206c657420746f6b656e73203d20696e7075742e6f75747075742e76616c7565207c3e2076616c75652e746f5f706169727328706f6c6963795f6964290a2020202020206c657420506169722861737365745f6e616d652c205f29203c2d206c6973742e616e7928746f6b656e73290a202020202020616e64207b0a202020202020202061737365745f6e616d6520213d207265665f746f6b656e5f6e616d652c0a20202020202020206279746561727261792e64726f702861737365745f6e616d652c203429203d3d1a20746f6b656e5f6e616d652c0a2020202020207d0a202020207d00163301500148020dd718128008101814000998041bab301130243754602260486ea800c004dd7181318119baa0011533021491426578706563742053637269707428706f6c6963795f696429203d20696e7075742e6f75747075742e616464726573732e7061796d656e745f63726564656e7469616c0016300c30223754601860446ea8c03cc088dd5000981218109baa001153301f49013f65787065637420536f6d6528696e70757429203d2074782e696e70757473207c3e207472616e73616374696f6e2e66696e645f696e707574286f5f72656629001632330010013758601660426ea8050894ccc08c0045300103d87a80001323253330213375e601c60486ea80080184c028cc0980092f5c0266008008002604e004604a00202c02c02c02c02c02c604460460046042002603a6ea80345888c94ccc070c020c078dd50008a5eb7bdb1804dd59811180f9baa0013300300200122323300100100322533302000114c103d87a800013232323253330203372200e0042a66604066e3c01c0084c024cc094dd3000a5eb80530103d87a8000133006006003375660440066eb8c080008c090008c088004dd2a40004603a603c603c00244646600200200644a66603a002297ae013232533301b32533301c3008301e3754002266e3c018dd71811180f9baa00114a06010603c6ea8c020c078dd5001099810001198020020008998020020009810801180f8009b87480088c0680048894ccc054c010c05cdd5001899299980d000801099299999980f80080189919299980e80080289929999998110008030030030991929998100008040992999810981200109919800800803911929998120010a806899192999999815000807007007007099191802981580318130019bae00130230013026002300200200930220013022003375a00200c603e002603e0066eac00400c00c00cc070004c060dd50018009b87480008c05cc06000488ccdc600099b81371a00400200460206ea8004c04cc050008c048004c048008c040004c030dd50008a4c2a6601492011856616c696461746f722072657475726e65642066616c73650013656153300849010f5f72656465656d65723a20566f69640016153300749144657870656374205b7265665f746f6b656e2c207573725f746f6b656e5d203d2074782e6d696e74207c3e2076616c75652e746f5f706169727328706f6c6963795f6964290016153300649158657870656374205b7265665f746f6b656e5f7574786f5d203d0a20202020202074782e6f757470757473207c3e207472616e73616374696f6e2e66696e645f7363726970745f6f75747075747328706f6c6963795f696429001615330054911a657870656374205f3a204369703638203d206d657461646174610016153300449158657870656374205b50616972287265665f746f6b656e5f6e616d652c205f295d203d0a202020202020696e7075742e6f75747075742e76616c7565207c3e2076616c75652e746f5f706169727328706f6c6963795f696429001615330034914a657870656374205b6f75747075745d203d2074782e6f757470757473207c3e207472616e73616374696f6e2e66696e645f7363726970745f6f75747075747328706f6c6963795f6964290016153300249154657870656374205b50616972286f5f7265665f746f6b656e5f6e616d652c205f295d203d0a2020202020206f75747075742e76616c7565207c3e2076616c75652e746f5f706169727328706f6c6963795f69642900165734ae7155ceaab9e5573eae815d0aba257481"
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
          const validatorAddress = validatorToAddress(lucid.config().network, spendingValidator);

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
          const validatorAddress = validatorToAddress(lucid.config().network, spendingValidator);

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
          const validatorAddress = validatorToAddress(lucid.config().network, spendingValidator);

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
          const validatorAddress = validatorToAddress(lucid.config().network, spendingValidator);

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
          const validatorAddress = validatorToAddress(lucid.config().network, spendingValidator);

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
          const validatorAddress = validatorToAddress(lucid.config().network, spendingValidator);

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
          const spendingScript = applyParamsToScript(Script.Receipts, [pkh]);
          const spendingValidator: SpendingValidator = { type: "PlutusV3", script: spendingScript };
          const validatorAddress = validatorToAddress(lucid.config().network, spendingValidator);

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

          const spendingValidator: SpendingValidator = { type: "PlutusV3", script: receiptScript };
          const validatorAddress = validatorToAddress(lucid.config().network, spendingValidator);

          const mintingPolicy: MintingPolicy = { type: "PlutusV3", script: receiptScript };
          const policyID = mintingPolicyToId(mintingPolicy);

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
            .attach.SpendingValidator(spendingValidator)
            .mintAssets(mintedAssets, redeemer)
            .attach.MintingPolicy(mintingPolicy)
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
          if (name.length > 64) throw "Asset Name is too long!";
          if (image.length > 64) throw "Asset Image URL is too long!";

          const metadata = Data.fromJson({ name, image });
          const version = BigInt(1);
          const extra: Data[] = [];
          const cip68 = new Constr(0, [metadata, version, extra]);

          const datum = Data.to(cip68);
          const redeemer = Data.void();

          const spendingValidator: SpendingValidator = { type: "PlutusV3", script: Script.Cip68 };
          const validatorAddress = validatorToAddress(lucid.config().network, spendingValidator);

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
          if (name.length > 64) throw "Asset Name is too long!";
          if (image.length > 64) throw "Asset Image URL is too long!";

          const metadata = Data.fromJson({ name, image });
          const version = BigInt(1);
          const extra: Data[] = [];
          const cip68 = new Constr(0, [metadata, version, extra]);

          const datum = Data.to(cip68);
          const redeemer = Data.void();

          const spendingValidator: SpendingValidator = { type: "PlutusV3", script: Script.Cip68 };
          const validatorAddress = validatorToAddress(lucid.config().network, spendingValidator);

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
