import React, { useEffect, useCallback } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search as SearchIcon } from "lucide-react"; // Import the search icon
import Link from "next/link"; // Import Link for navigation

interface DuplicateEmail {
  email: string;
  count: number;
  documents: {
    timestamp: string;
    email: string;
  }[];
}

export default function DuplicateEmailFinder({ startDate, endDate }: { startDate: Date | null; endDate: Date | null }) {
  const [duplicates, setDuplicates] = React.useState<DuplicateEmail[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [totalCount, setTotalCount] = React.useState<number>(0);
  const [totalDuplicates, setTotalDuplicates] = React.useState<number>(0);

  const findDuplicates = useCallback(async () => {
    if (!startDate || !endDate) {
      setError("Start and end dates are required");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.post("/api/opensearch", {
        size: 0,
        query: {
          bool: {
            filter: [
              {
                range: {
                  esign_timestamp: {
                    gte: startDate,
                    lte: endDate,
                  },
                },
              },
            ],
          },
        },
        aggs: {
          duplicates: {
            terms: {
              field: "email_address",
              min_doc_count: 2,
              size: 1000,
            },
            aggs: {
              docs: {
                top_hits: {
                  size: 100,
                  _source: ["email_address", "esign_timestamp"],
                },
              },
            },
          },
        },
      });
      const duplicateEmails = response.data.aggregations.duplicates.buckets.map(
        (bucket: { key: string; doc_count: number; docs: { hits: { hits: { _source: { email_address: string; esign_timestamp: string } } } } }) => ({
          email: bucket.key,
          count: bucket.doc_count,
          // @ts-ignore
          documents: bucket.docs.hits.hits.map((hit: { _source: { email_address: string; esign_timestamp: string } }) => ({
            timestamp: new Date(hit._source.esign_timestamp).toLocaleString(),
            email: hit._source.email_address,
          })),
        })
      );
      setDuplicates(duplicateEmails);
      setTotalCount(response.data.aggregations.duplicates.buckets.length);
      
      // Calculate total duplicates
      const total = duplicateEmails.reduce((sum: number, dup: DuplicateEmail) => sum + dup.count, 0);
      setTotalDuplicates(total);
    } catch (err: any) {
      setError("Failed to fetch duplicate emails: " + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    if (startDate && endDate) {
      findDuplicates();
    }
  }, [startDate, endDate, findDuplicates]);

  return (
    <Card className="w-full h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle>Duplicate Leads</CardTitle>
        <CardDescription>{totalDuplicates} Duplicates, {totalCount} Unique</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow overflow-auto">
        {isLoading && <p className="text-center">Loading...</p>}
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {duplicates.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Count</TableHead>
                <TableHead>Timestamps</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {duplicates.map((dup, index) => (
                <TableRow key={index}>
                  <TableCell>
                    {dup.email}
                    <Link href={`/?tab=search&email=${dup.email}`} passHref>
                      <SearchIcon className="inline-block ml-1 w-4 h-4 cursor-pointer" />
                    </Link>
                  </TableCell>
                  <TableCell>{dup.count}</TableCell>
                  <TableCell>
                    {dup.documents.map((doc, i) => (
                      <div key={i}>{doc.timestamp}</div>
                    ))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {duplicates.length === 0 && !isLoading && (
          <p className="text-center text-gray-500">No duplicates found</p>
        )}
      </CardContent>
    </Card>
  );
}