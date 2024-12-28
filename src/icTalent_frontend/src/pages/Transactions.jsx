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
import { Loader2 } from "lucide-react";

function Transactions() {
  const { actors, isAuthenticated } = useContext(ActorContext);
  const { toast } = useToast();
  const [transferAmount, setTransferAmount] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [balance, setBalance] = useState(0);
  const [tokenBalances, setTokenBalances] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && actors?.icTalentBackend) {
      fetchBalance();
      fetchAllTokenBalances();
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

  const fetchAllTokenBalances = async () => {
    setIsLoading(true);
    try {
      const balances = await actors.tokenFactory.get_all_token_balances();
      console.log(balances);
      if ("Ok" in balances) {
        const formattedBalances = balances.Ok.map(([principal, balance]) => ({
          principal: principal.toString(),
          balance: Number(balance),
        }));
        setTokenBalances(formattedBalances);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch token balances",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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

      <Card>
        <CardHeader>
          <CardTitle>Your Token Holdings</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : tokenBalances.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tokenBalances.map((token) => (
                <div
                  key={token.principal}
                  className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm"
                >
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      Token ID:
                    </div>
                    <div className="font-mono text-sm truncate max-w-[200px]">
                      {token.principal}
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <div className="text-sm text-muted-foreground">
                      Balance:
                    </div>
                    <div className="font-semibold">{token.balance}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground p-4">
              You don't own any talent tokens yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default Transactions;
