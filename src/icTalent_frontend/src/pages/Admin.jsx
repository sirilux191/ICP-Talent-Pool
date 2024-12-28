import React, { useState, useEffect, useContext } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/use-toast";
import { Principal } from "@dfinity/principal";
import ActorContext from "../ActorContext";

function Admin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [requests, setRequests] = useState([]);
  const { actors } = useContext(ActorContext);
  const { toast } = useToast();
  const [newAdminPrincipal, setNewAdminPrincipal] = useState("");
  const [tokenCanisterId, setTokenCanisterId] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [wasmFile, setWasmFile] = useState(null);
  const [selectedModule, setSelectedModule] = useState("TokenFactory");

  useEffect(() => {
    fetchFaucetRequests();
  }, [actors]);

  const fetchFaucetRequests = async () => {
    if (!actors?.tokenFactory) return;

    try {
      const adminResult = await actors.tokenFactory.get_admin();
      if ("Ok" in adminResult) {
        const currentAdmin = adminResult.Ok.toString();
        const callerResult = await actors.icTalentBackend.whoami();
        const caller = callerResult.toString();
        const isCurrentUserAdmin = currentAdmin === caller;
        setIsAdmin(isCurrentUserAdmin);
      }

      if (isAdmin) {
        const result = await actors.tokenFactory.get_faucet_requests();
        console.log("Faucet requests result:", result);

        if ("Ok" in result) {
          const formattedRequests = result.Ok.map(([principal, request]) => ({
            id: principal.toString(),
            amount: Number(request.current_token_request),
            totalRequests: Number(request.total_number_of_request),
            totalGiven: Number(request.total_token_given),
            status: request.status,
          }));
          setRequests(formattedRequests);
        } else {
          const errorMessage =
            typeof result.Err === "object"
              ? result.Err.NotAuthorized
                ? "Not authorized to view requests"
                : result.Err.RequestNotFound
                ? "No requests found"
                : "Unknown error"
              : result.Err;

          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      const errorMessage = error.message || "Failed to fetch faucet requests";
      console.error("Error in fetchFaucetRequests:", error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchFaucetRequests();
    }
  }, [isAdmin, actors]);

  const handleRegisterAdmin = async () => {
    try {
      const result = await actors.tokenFactory.register_admin();
      if (result.Ok) {
        setIsAdmin(true);
        toast({
          title: "Success",
          description: "Successfully registered as admin",
        });
      } else {
        toast({
          title: "Error",
          description: result.Err || "Failed to register as admin",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to register as admin",
        variant: "destructive",
      });
    }
  };

  const handleApproveTokenSpending = async (amount) => {
    try {
      setIsApproving(true);
      const approveArgument = {
        fee: [],
        memo: [],
        from_subaccount: [],
        created_at_time: [],
        amount: BigInt(amount),
        expected_allowance: [],
        expires_at: [],
        spender: {
          owner: Principal.fromText(
            process.env.CANISTER_ID_IC_TALENT_TOKEN_FACTORY_CANISTER
          ),
          subaccount: [],
        },
      };

      const result =
        await actors.icrc_talent_token_ledger_canister.icrc2_approve(
          approveArgument
        );

      if ("Ok" in result) {
        toast({
          title: "Success",
          description: "Token spending approved",
        });
        return true;
      } else {
        const errorMessage =
          typeof result.Err === "object"
            ? Object.keys(result.Err)[0]
            : "Failed to approve token spending";
        throw new Error(errorMessage);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve token spending",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsApproving(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      const request = requests.find((req) => req.id === requestId);
      if (!request) {
        throw new Error("Request not found");
      }

      // First approve token spending
      const approvalSuccess = await handleApproveTokenSpending(request.amount);
      if (!approvalSuccess) {
        return;
      }

      // Then proceed with accepting the request
      const result = await actors.tokenFactory.accept_token_request(
        Principal.fromText(requestId)
      );

      if ("Ok" in result) {
        setRequests(
          requests.map((req) =>
            req.id === requestId ? { ...req, status: "approved" } : req
          )
        );
        toast({
          title: "Success",
          description: result.Ok || `Request approved successfully`,
        });
        await fetchFaucetRequests();
      } else {
        const errorMessage =
          typeof result.Err === "object"
            ? result.Err.NotAuthorized
              ? "Not authorized to approve requests"
              : result.Err.RequestNotFound
              ? "Request not found"
              : result.Err.TransferFailed
              ? `Transfer failed: ${result.Err.TransferFailed}`
              : "Unknown error"
            : result.Err;

        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve request",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (requestId) => {
    try {
      const result = await actors.tokenFactory.reject_token_request(
        Principal.fromText(requestId)
      );
      if ("Ok" in result) {
        setRequests(
          requests.map((req) =>
            req.id === requestId ? { ...req, status: "rejected" } : req
          )
        );
        toast({
          title: "Success",
          description: result.Ok || "Request rejected successfully",
        });
        await fetchFaucetRequests();
      } else {
        const errorMessage =
          typeof result.Err === "object"
            ? result.Err.NotAuthorized
              ? "Not authorized to reject requests"
              : result.Err.RequestNotFound
              ? "Request not found"
              : "Unknown error"
            : result.Err;

        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject request",
        variant: "destructive",
      });
    }
  };

  const handleChangeAdmin = async () => {
    try {
      const result = await actors.tokenFactory.change_admin(
        Principal.fromText(newAdminPrincipal)
      );
      if ("Ok" in result) {
        toast({
          title: "Success",
          description: "Admin changed successfully",
        });
        setNewAdminPrincipal("");
      } else {
        toast({
          title: "Error",
          description: result.Err || "Failed to change admin",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to change admin",
        variant: "destructive",
      });
    }
  };

  const handleSetTokenCanister = async () => {
    try {
      const result = await actors.tokenFactory.set_token_canister(
        Principal.fromText(tokenCanisterId)
      );
      if ("Ok" in result) {
        toast({
          title: "Success",
          description: "Token canister set successfully",
        });
        setTokenCanisterId("");
      } else {
        toast({
          title: "Error",
          description: result.Err || "Failed to set token canister",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to set token canister",
        variant: "destructive",
      });
    }
  };

  const readFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  };

  const handleWasmFileChange = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      setWasmFile(event.target.files[0]);
    }
  };

  const handleUpdateWasmModule = async (event) => {
    event.preventDefault();
    if (!wasmFile) {
      toast({
        title: "Error",
        description: "Please select a WASM file first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const arrayBuffer = await readFile(wasmFile);
      const byteArray = [...new Uint8Array(arrayBuffer)];

      const result = await actors.tokenFactory.update_wasm_module(byteArray);

      if ("Ok" in result) {
        toast({
          title: "Success",
          description: `WASM module updated successfully.`,
        });
        setWasmFile(null);
      } else {
        toast({
          title: "Error",
          description: result.Err || "Failed to update WASM module",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to update WASM module",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Token Requests</h1>
        {!isAdmin && (
          <Button
            size="lg"
            onClick={handleRegisterAdmin}
          >
            Register as Admin
          </Button>
        )}
      </div>

      {isAdmin ? (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Change Admin</h2>
              <input
                type="text"
                value={newAdminPrincipal}
                onChange={(e) => setNewAdminPrincipal(e.target.value)}
                placeholder="New Admin Principal ID"
                className="w-full p-2 border rounded text-black dark:text-white dark:bg-gray-800"
              />
              <Button onClick={handleChangeAdmin}>Change Admin</Button>
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Set Token Canister</h2>
              <input
                type="text"
                value={tokenCanisterId}
                onChange={(e) => setTokenCanisterId(e.target.value)}
                placeholder="Token Canister ID"
                className="w-full p-2 border rounded text-black dark:text-white dark:bg-gray-800"
              />
              <Button onClick={handleSetTokenCanister}>
                Set Token Canister
              </Button>
            </div>
          </div>

          <div className="space-y-2 mb-6">
            <h2 className="text-lg font-semibold">Update WASM Module</h2>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <input
                  type="file"
                  accept=".wasm"
                  onChange={handleWasmFileChange}
                  className="w-full p-2 border rounded text-black dark:text-white dark:bg-gray-800"
                />
              </div>
              <Button
                onClick={handleUpdateWasmModule}
                disabled={!wasmFile}
              >
                Update WASM Module
              </Button>
            </div>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Principal ID</TableHead>
                  <TableHead>Amount Requested</TableHead>
                  <TableHead>Total Requests</TableHead>
                  <TableHead>Total Given</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.id}</TableCell>
                    <TableCell>{request.amount} Tokens</TableCell>
                    <TableCell>{request.totalRequests}</TableCell>
                    <TableCell>{request.totalGiven}</TableCell>
                    <TableCell>
                      <span
                        className={`capitalize ${
                          request.status === "approved"
                            ? "text-green-500"
                            : request.status === "rejected"
                            ? "text-red-500"
                            : "text-yellow-500"
                        }`}
                      >
                        {request.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {request.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleApprove(request.id)}
                              disabled={isApproving}
                            >
                              {isApproving ? "Approving..." : "Approve"}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(request.id)}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">
            Register as admin to view and manage token requests
          </p>
        </div>
      )}
    </div>
  );
}

export default Admin;
