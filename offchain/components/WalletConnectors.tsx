import { useEffect, useState } from "react";
import { Button } from "@nextui-org/button";
import { Wallet } from "@/types/cardano";

export default function WalletConnectors(props: { onConnectWallet: (wallet: Wallet) => Promise<void> }) {
  const { onConnectWallet } = props;

  const [wallets, setWallets] = useState<Wallet[]>();

  useEffect(() => {
    const wallets: Wallet[] = [];

    const { cardano } = window;

    for (const c in cardano) {
      const wallet = cardano[c];

      if (!wallet.apiVersion) continue; // skip
      wallets.push(wallet);
    }

    wallets.sort((l: Wallet, r: Wallet) => {
      return l.name.toUpperCase() < r.name.toUpperCase() ? -1 : 1;
    });
    setWallets(wallets);
  }, []);

  ///////////////////////////////////////////////////////////////////////////////////

  if (!wallets) return <span className="uppercase">Browsing Cardano Wallets</span>;

  if (!wallets.length) return <span className="uppercase">No Cardano Wallet</span>;

  return (
    <div className="flex flex-wrap gap-2">
      {wallets.map((wallet, w) => (
        <Button
          key={`wallet.${w}`}
          onPress={() => onConnectWallet(wallet)}
          className="bg-gradient-to-tr from-pink-500 to-yellow-500 text-white shadow-lg capitalize"
          radius="full"
        >
          {wallet.name}
        </Button>
      ))}
    </div>
  );
}
