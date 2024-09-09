import React, { useEffect } from "react";
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

export default function DuplicateEmailFinder({ startDate, endDate }) {
  const [duplicates, setDuplicates] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [totalCount, setTotalCount] = React.useState(0);
  const [totalDuplicates, setTotalDuplicates] = React.useState(0);

  const findDuplicates = async () => {
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
        (bucket) => ({
          email: bucket.key,
          count: bucket.doc_count,
          documents: bucket.docs.hits.hits.map((hit) => ({
            timestamp: new Date(hit._source.esign_timestamp).toLocaleString(),
            email: hit._source.email_address,
          })),
        })
      );
      setDuplicates(duplicateEmails);
      setTotalCount(response.data.aggregations.duplicates.buckets.length);
      
      // Calculate total duplicates
      const total = duplicateEmails.reduce((sum, dup) => sum + dup.count, 0);
      setTotalDuplicates(total);
    } catch (err) {
      setError("Failed to fetch duplicate emails: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (startDate && endDate) {
      findDuplicates();
    }
  }, [startDate, endDate]);

  return (
    <Card className="w-full max-w-4xl mx-auto overflow-y-scroll max-h-[600px]">
      <CardHeader>
        <CardTitle>Duplicate Emails (Unique: {totalCount}, Total: {totalDuplicates})</CardTitle>
      </CardHeader>
      <CardContent>
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
                  <TableCell>{dup.email}</TableCell>
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