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
import Link from "next/link";
import { Search as SearchIcon } from "lucide-react";

interface UndeliveredSignsFinderProps {
  startDate: Date | null;
  endDate: Date | null;
}

interface UndeliveredSign {
  timestamp: string;
  product: string;
  email: string;
  esignTimestamp: string;
  duplicate: string;
  tgg_duplicate: string;
}

export default function UndeliveredSignsFinder({ startDate, endDate }: UndeliveredSignsFinderProps) {
  const [undeliveredSigns, setUndeliveredSigns] = React.useState<UndeliveredSign[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [totalCount, setTotalCount] = React.useState(0);

  const findUndeliveredSigns = async () => {
    if (!startDate || !endDate) {
      setError("Start and end dates are required");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post("/api/opensearch", {
        size: 100, // Adjust this value based on how many results you want to retrieve
        query: {
          bool: {
            must: [
              {
                range: {
                  esign_timestamp: {
                    gte: startDate.getTime(),
                    lte: endDate.getTime(),
                  },
                },
              },
              {
                bool: {
                  must: [
                    {
                      bool: {
                        must_not: {
                          exists: {
                            field: "delivered_timestamp",
                          },
                        },
                      },
                    },
                    {
                      bool: {
                        must_not: {
                          exists: {
                            field: "duplicate",
                          },
                        },
                      },
                    },
                    {
                      bool: {
                        must_not: {
                          exists: {
                            field: "tgg_duplicate",
                          },
                        },
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        sort: [{ esign_timestamp: "desc" }],
        _source: ["email_address", "esign_timestamp", "delivered_timestamp", "timestamp", "product"],
      });

      const undeliveredSignsData = response.data.hits.hits.map((hit: any) => ({
        timestamp: hit._source.timestamp,
        product: hit._source.product,
        email: hit._source.email_address,
        esignTimestamp: new Date(hit._source.esign_timestamp).toLocaleString(),
      }));

      setUndeliveredSigns(undeliveredSignsData);
      setTotalCount(response.data.hits.total.value);
    } catch (err: any) {
      setError("Failed to fetch undelivered signs: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (startDate && endDate) {
      findUndeliveredSigns();
    }
  }, [startDate, endDate]);

  return (
    <Card className="w-full h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle>Undelivered Leads ({totalCount})</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-auto">
        {isLoading && <p className="text-center">Loading...</p>}

        {error && <p className="text-red-500 mb-4">{error}</p>}

        {undeliveredSigns.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky top-0 bg-white">Timestamp</TableHead>
                <TableHead className="sticky top-0 bg-white">Product</TableHead>
                <TableHead className="sticky top-0 bg-white">Email</TableHead>
                <TableHead className="sticky top-0 bg-white">E-Sign Timestamp</TableHead>
                <TableHead className="sticky top-0 bg-white">Duplicate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {undeliveredSigns.map((sign, index) => (
                <TableRow key={index}>
                  <TableCell><Link target="_blank" href={`https://eu-west-1.console.aws.amazon.com/dynamodbv2/home?region=eu-west-1#edit-item?itemMode=2&pk=${sign.product}&route=ROUTE_ITEM_EXPLORER&sk=${sign.timestamp}&table=leads-prod`}>{sign.timestamp}</Link></TableCell>
                  <TableCell>{sign.product}</TableCell>
                  <TableCell>
                    {sign.email}
                    <Link href={`/?tab=search&email=${sign.email}`} passHref>
                      <SearchIcon className="inline-block ml-1 w-4 h-4 cursor-pointer" />
                    </Link>
                  </TableCell>
                  <TableCell>{sign.esignTimestamp}</TableCell>
                  <TableCell>{sign.tgg_duplicate}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {undeliveredSigns.length === 0 && !isLoading && (
          <p className="text-center text-gray-500">
            No undelivered signed documents found
          </p>
        )}
      </CardContent>
    </Card>
  );
}
