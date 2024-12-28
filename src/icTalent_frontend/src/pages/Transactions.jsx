import React, { useState, useContext, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";
import ActorContext from "../ActorContext";
import { Principal } from "@dfinity/principal";
import { useToast } from "../hooks/use-toast";

function Transactions() {
  const { actors, isAuthenticated } = useContext(ActorContext);
  const { toast } = useToast();
  const [transferAmount, setTransferAmount] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    if (isAuthenticated && actors?.icTalentBackend) {
      fetchBalance();
    }
  }, [isAuthenticated, actors]);

  const fetchBalance = async () => {
    try {
      const result =
        await actors.icrc_talent_token_ledger_canister.icrc1_balance_of({
          owner: await actors.icTalentBackend.whoami(),
          subaccount: [],
        });
      setBalance(Number(result));
      toast({
        title: "Balance",
        description: `${Number(result)} Tokens`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch balance",
        variant: "destructive",
      });
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast({
        title: "Error",
        description: "Please login first",
        variant: "destructive",
      });
      return;
    }

    try {
      const amount = parseInt(transferAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Please enter a valid amount");
      }

      const result =
        await actors.icrc_talent_token_ledger_canister.icrc1_transfer({
          to: {
            owner: Principal.fromText(recipientAddress),
            subaccount: [],
          },
          amount: BigInt(amount),
          fee: [],
          memo: [],
          from_subaccount: [],
          created_at_time: [],
        });

      if ("Ok" in result) {
        toast({
          title: "Success",
          description: "Transfer completed successfully",
        });
        setTransferAmount("");
        setRecipientAddress("");
        fetchBalance();
      } else {
        const errorKey = String(Object.keys(result.Err)[0]);
        const errorDetails = result.Err[errorKey];
        const errorSecondKey = String(Object.keys(errorDetails)[0]);
        const errorSecondDetails = errorDetails[errorSecondKey];
        const errorMessage = errorSecondDetails?.someMessage || "Unknown error";
        throw new Error(`${errorKey}: ${errorSecondKey}, ${secondMessage}`);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Transfer failed",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Token Transactions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-lg">Current Balance: {balance} Tokens</div>

          <form
            onSubmit={handleTransfer}
            className="space-y-4"
          >
            <div>
              <Input
                type="text"
                placeholder="Recipient Principal ID"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                required
              />
            </div>
            <div>
              <Input
                type="number"
                placeholder="Amount"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                required
                min="1"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
            >
              Transfer Tokens
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default Transactions;
