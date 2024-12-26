import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Button } from "../components/ui/button";
import { useToast } from "../components/ui/use-toast";

function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { notify } = useToast();

  // Mock data - replace with actual data from your backend
  const [requests, setRequests] = useState([
    {
      id: "rrkah-fqaaa-aaaaa-aaaaq-cai",
      amount: 1000,
      status: "pending",
    },
    {
      id: "qjdnr-maaaa-aaaaa-aaaqq-cai",
      amount: 500,
      status: "pending",
    },
  ]);

  const handleLogin = async () => {
    // Implement your authentication logic here
    try {
      // Mock authentication - replace with actual authentication
      setIsAuthenticated(true);
      notify({
        title: "Success",
        description: "Successfully logged in as admin",
      });
    } catch (error) {
      notify({
        title: "Error",
        description: "Failed to login. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleApprove = async (requestId) => {
    try {
      // Add your approval logic here
      setRequests(
        requests.map((req) =>
          req.id === requestId ? { ...req, status: "approved" } : req
        )
      );
      notify({
        title: "Success",
        description: `Request ${requestId} approved successfully`,
      });
    } catch (error) {
      notify({
        title: "Error",
        description: "Failed to approve request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (requestId) => {
    try {
      // Add your rejection logic here
      setRequests(
        requests.map((req) =>
          req.id === requestId ? { ...req, status: "rejected" } : req
        )
      );
      notify({
        title: "Success",
        description: `Request ${requestId} rejected successfully`,
      });
    } catch (error) {
      notify({
        title: "Error",
        description: "Failed to reject request. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <h1 className="text-2xl font-bold">Admin Authentication Required</h1>
        <Button
          size="lg"
          onClick={handleLogin}
        >
          Login as Admin
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Token Requests</h1>
        <Button
          variant="outline"
          onClick={() => setIsAuthenticated(false)}
        >
          Logout
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Principal ID</TableHead>
              <TableHead>Amount Requested</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-medium">{request.id}</TableCell>
                <TableCell>{request.amount} Tokens</TableCell>
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
                        >
                          Approve
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
    </div>
  );
}

export default Admin;
