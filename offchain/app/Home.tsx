import { useEffect, useState } from "react";

import { Wallet } from "@/types/cardano";
import WalletConnectors from "@/components/WalletConnectors";
import Dashboard from "@/components/Dashboard";

import { Address, Lucid, LucidEvolution } from "@lucid-evolution/lucid";
import { network, provider } from "@/config/lucid";

export default function Home() {
  const [lucid, setLucid] = useState<LucidEvolution>();
  const [address, setAddress] = useState<Address>(""); // Address = string; eg. "addr_..."
  const [result, setResult] = useState("");

  useEffect(() => {
    Lucid(provider, network).then(setLucid).catch(handleError);
    localStorage.clear();
  }, []);

  //#region helper functions
  function handleError(error: any) {
    const { info, message } = error;
    const errorMessage = `${message}`;

    try {
      // KoiosError:
      const a = errorMessage.indexOf("{", 1);
      const b = errorMessage.lastIndexOf("}", errorMessage.lastIndexOf("}") - 1) + 1;

      const rpc = errorMessage.slice(a, b);
      const jsonrpc = JSON.parse(rpc);

      const errorData = jsonrpc.error.data[0].error.data;
      try {
        const { validationError, traces } = errorData;

        setResult(`${validationError} Traces: ${traces.join(", ")}.`);
        console.error({ [validationError]: traces });
      } catch {
        const { reason } = errorData;

        setResult(`${reason}`);
        console.error(reason);
      }
    } catch {
      function toJSON(error: any) {
        try {
          const errorString = JSON.stringify(error);
          const errorJSON = JSON.parse(errorString);
          return errorJSON;
        } catch {
          return {};
        }
      }

      const { cause } = toJSON(error);
      const { failure } = cause ?? {};

      const failureCause = failure?.cause;

      let failureTrace: string | undefined;
      try {
        failureTrace = eval(failureCause).replaceAll(" Trace ", " \n ");
      } catch {
        failureTrace = undefined;
      }

      const failureInfo = failureCause?.info;
      const failureMessage = failureCause?.message;

      setResult(`${failureTrace ?? failureInfo ?? failureMessage ?? info ?? message ?? error}`);
      console.error(failureCause ?? { error });
    }
  }

  async function onConnectWallet(wallet: Wallet) {
    try {
      if (!lucid) throw "Uninitialized Lucid";

      const api = await wallet.enable();
      lucid.selectWallet.fromAPI(api);

      const address = await lucid.wallet().address();
      setAddress(address);
    } catch (error) {
      handleError(error);
    }
  }
  //#endregion

  return (
    <div className="flex justify-center overflow-hidden">
      <div className="flex flex-col gap-2 overflow-hidden">
        {lucid ? (
          address ? (
            // wallet connected: Show Dashboard
            <Dashboard address={address} lucid={lucid} onError={handleError} setActionResult={setResult} />
          ) : (
            // no wallet connected yet: Show Wallet button List
            <WalletConnectors onConnectWallet={onConnectWallet} />
          )
        ) : (
          <span className="uppercase">Initializing Lucid</span>
        )}
        <span className="font-mono break-words whitespace-pre-wrap">{result}</span>
      </div>
    </div>
  );
}
