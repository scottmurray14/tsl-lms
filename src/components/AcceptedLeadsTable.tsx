import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search as SearchIcon } from "lucide-react";
import Link from "next/link";

interface AcceptedLead {
  email: string;
  timestamp: string;
}

export default function AcceptedLeadsTable({ startDate, endDate }: { startDate: Date | null; endDate: Date | null }) {
  const [acceptedLeads, setAcceptedLeads] = useState<AcceptedLead[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);

  const fetchAcceptedLeads = async () => {
    if (!startDate || !endDate) {
      setError("Start and end dates are required");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.post("/api/opensearch", {
        size: 100,
        query: {
          bool: {
            must: [
              {
                range: {
                  esign_timestamp: {
                    gte: startDate,
                    lte: endDate,
                  },
                },
              },
              {
                term: {
                  is_accepted: true,
                },
              },
            ],
          },
        },
        _source: ["email_address", "esign_timestamp"],
      });

      const leads = response.data.hits.hits.map((hit: any) => ({
        email: hit._source.email_address,
        timestamp: new Date(hit._source.esign_timestamp).toLocaleString(),
      }));

      setAcceptedLeads(leads);
      setTotalCount(response.data.hits.total.value);
    } catch (err: any) {
      setError("Failed to fetch accepted leads: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (startDate && endDate) {
      fetchAcceptedLeads();
    }
  }, [startDate, endDate]);

  return (
    <Card className="w-full h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle>Accepted Leads (Total: {totalCount})</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-auto">
        {isLoading && <p className="text-center">Loading...</p>}
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {acceptedLeads.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {acceptedLeads.map((lead, index) => (
                <TableRow key={index}>
                  <TableCell>
                    {lead.email}
                    <Link href={`/?tab=search&email=${lead.email}`} passHref>
                      <SearchIcon className="inline-block ml-1 w-4 h-4 cursor-pointer" />
                    </Link>
                  </TableCell>
                  <TableCell>{lead.timestamp}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {acceptedLeads.length === 0 && !isLoading && (
          <p className="text-center text-gray-500">No accepted leads found</p>
        )}
      </CardContent>
    </Card>
  );
}