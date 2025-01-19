import { useEffect, useState } from "react";

import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from "@heroui/modal";
import { Select, SelectItem } from "@heroui/select";

import { Action } from "@/types/action";

export default function Cip68(props: { onMint: Action; onUpdate: Action }) {
  const { onMint, onUpdate } = props;

  function MintButton() {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    const [name, setTokenName] = useState("");
    const [image, setTokenImageURL] = useState("");
    const [label, setTokenLabel] = useState(222);
    const [qty, setTokenQty] = useState(1);

    useEffect(() => {
      if (label == 222) setTokenQty(1);
    }, [label]);

    return (
      <>
        <Button onPress={onOpen} className="bg-gradient-to-tr from-pink-500 to-yellow-500 text-white shadow-lg" radius="full">
          Mint
        </Button>

        <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="top-center">
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">Mint</ModalHeader>
                <ModalBody>
                  <Input label="Name" placeholder=" " variant="bordered" onValueChange={setTokenName} />
                  <Input label="Image URL" placeholder=" " variant="bordered" onValueChange={setTokenImageURL} />
                  <Select
                    label="Token type"
                    placeholder="NFT"
                    variant="bordered"
                    onChange={(e) => setTokenLabel(e.target.value ? parseInt(e.target.value) : 222)}
                  >
                    <SelectItem key={222}>NFT</SelectItem>
                    <SelectItem key={333}>FT</SelectItem>
                    <SelectItem key={444}>RFT</SelectItem>
                  </Select>
                  <Input
                    type="number"
                    label="Quantity"
                    placeholder="1"
                    variant="bordered"
                    isDisabled={label == 222}
                    onValueChange={(value: string) => setTokenQty(parseInt(value))}
                    value={qty.toString()}
                  />
                </ModalBody>
                <ModalFooter>
                  <Button
                    onPress={() => onMint({ name, image, label, qty }).then(onClose)}
                    className="bg-gradient-to-tr from-pink-500 to-yellow-500 text-white shadow-lg"
                    radius="full"
                  >
                    Submit
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </>
    );
  }

  function UpdateButton() {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    const [name, setTokenName] = useState("");
    const [image, setTokenImageURL] = useState("");

    return (
      <>
        <Button onPress={onOpen} className="bg-gradient-to-tr from-pink-500 to-yellow-500 text-white shadow-lg" radius="full">
          Update
        </Button>

        <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="top-center">
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">Update</ModalHeader>
                <ModalBody>
                  <Input label="Name" placeholder="Enter token name" variant="bordered" onValueChange={setTokenName} />
                  <Input label="Image URL" placeholder="Enter token image URL" variant="bordered" onValueChange={setTokenImageURL} />
                </ModalBody>
                <ModalFooter>
                  <Button
                    onPress={() => onUpdate({ name, image }).then(onClose)}
                    className="bg-gradient-to-tr from-pink-500 to-yellow-500 text-white shadow-lg"
                    radius="full"
                  >
                    Submit
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 mb-2">
      <MintButton />
      <UpdateButton />
    </div>
  );
}
