"use client";
import { useState } from "react";
import axios from "axios";
import { BarChart, Card, Title } from "@tremor/react";
import {
  Card as ShadcnCard,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Chart } from "@/components/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React from "react";
import Search from "@/components/search";
import DuplicateEmailFinder from "@/components/duplicates";
import UndeliveredSignsFinder from "@/components/DeliveryIssuesTable";

export default function Home() {
  const [chartTotal, setChartTotal] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [totalHits, setTotalHits] = useState<number | null>(null);
  const [totalEsigns, setTotalEsigns] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!startDate || !endDate) {
      setError("Please select both start and end dates");
      return;
    }

    setIsLoading(true);
    setError(null);

    const startTimestamp = startDate.getTime() + 3600000;
    const endTimestamp = endDate.getTime() + 3600000;

    try {
      const [
        hitsResponse,
        esignsResponse,
        esignAggregation,
        partialAggregation,
        deliveryAggregation,
        duplicateAggregation,
      ] = await Promise.all([
        axios.post("/api/opensearch", {
          from: 0,
          size: itemsPerPage,
          track_total_hits: true,
          query: {
            bool: {
              must: [
                {
                  range: {
                    timestamp: {
                      gte: startTimestamp,
                      lt: endTimestamp,
                    },
                  },
                },
              ],
            },
          },
        }),
        axios.post("/api/opensearch", {
          track_total_hits: true,
          query: {
            bool: {
              must: [
                {
                  range: {
                    esign_timestamp: {
                      gte: startTimestamp,
                      lt: endTimestamp,
                    },
                  },
                },
              ],
            },
          },
        }),
        axios.post("/api/opensearch", {
          track_total_hits: true,
          query: {
            bool: {
              must: [
                {
                  range: {
                    esign_timestamp: {
                      gte: startTimestamp,
                      lt: endTimestamp,
                    },
                  },
                },
              ],
            },
          },
          aggs: {
            sales_over_time: {
              date_histogram: {
                field: "esign_timestamp",
                calendar_interval: "hour",
                format: "d/ha",
              },
            },
          },
          size: 0,
        }),
        axios.post("/api/opensearch", {
          track_total_hits: true,
          query: {
            bool: {
              must: [
                {
                  range: {
                    timestamp: {
                      gte: startTimestamp,
                      lt: endTimestamp,
                    },
                  },
                },
              ],
            },
          },
          aggs: {
            sales_over_time: {
              date_histogram: {
                field: "timestamp",
                calendar_interval: "hour",
                format: "d/ha",
              },
            },
          },
          size: 0,
        }),
        axios.post("/api/opensearch", {
          track_total_hits: true,
          query: {
            bool: {
              must: [
                {
                  range: {
                    delivered_timestamp: {
                      gte: startTimestamp,
                      lt: endTimestamp,
                    },
                  },
                },
                {
                  exists: {
                    field: "external_lead_id",
                  },
                },
              ],
            },
          },
          aggs: {
            sales_over_time: {
              date_histogram: {
                field: "delivered_timestamp",
                calendar_interval: "hour",
                format: "d/ha",
              },
            },
          },
          size: 0,
        }),
        axios.post("/api/opensearch", {
          track_total_hits: true,
          query: {
            bool: {
              must: [
                {
                  range: {
                    esign_timestamp: {
                      gte: startTimestamp,
                      lt: endTimestamp,
                    },
                  },
                },
                {
                  match_phrase: {
                    delivery_error: "DUPLICATE",
                  },
                },
              ],
            },
          },
          aggs: {
            sales_over_time: {
              date_histogram: {
                field: "esign_timestamp",
                calendar_interval: "hour",
                format: "d/ha",
                time_zone: "GMT",
              },
            },
          },
          size: 0,
        }),
      ]);

      const partials_data = processAggregationPartial(
        partialAggregation.data.aggregations
      );
      const esigns_data = processAggregationEsign(
        esignAggregation.data.aggregations
      );
      const delivery_data = processAggregationDelivery(
        deliveryAggregation.data.aggregations
      );
      const duplicate_data = processAggregationDuplicate(
        duplicateAggregation.data.aggregations
      );

      // Combine data based on date
      const combinedData = partials_data.map((mobileItem: { date: any; mobile: any; }) => {
        const desktopItem = esigns_data.find(
          (desktopItem: { date: any; }) => desktopItem.date === mobileItem.date
        );
        const deliveryItem = delivery_data.find(
          (deliveryItem: { date: any; }) => deliveryItem.date === mobileItem.date
        );
        const duplicateItem = duplicate_data.find(
          (duplicateItem: { date: any; }) => duplicateItem.date === mobileItem.date
        );

        return {
          date: mobileItem.date,
          mobile: mobileItem.mobile,
          desktop: desktopItem ? desktopItem.desktop : 0,
          delivery: deliveryItem ? deliveryItem.delivery : 0,
          duplicate: duplicateItem ? duplicateItem.duplicate : 0,
        };
      });

      setChartData(combinedData);
      setTotalHits(hitsResponse.data.hits.total.value);
      setTotalEsigns(esignsResponse.data.hits.total.value);
      setTotalHits(hitsResponse.data.hits.total.value);
      setTotalEsigns(esignsResponse.data.hits.total.value);

      // Process data for the table
      const processedTableData = hitsResponse.data.hits.hits.map(
        (hit: any) => ({
          timestamp: new Date(hit._source.timestamp).toLocaleString(),
          email: hit._source.email_address,
        })
      );

      setTableData(processedTableData);
      setCurrentPage(1); // Reset to first page when new data is fetched
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [tableData, setTableData] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalPages = totalHits ? Math.max(1, Math.ceil(totalHits / itemsPerPage)) : 1;
  const currentPageData = tableData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const processAggregationPartial = (aggregations: { sales_over_time: { buckets: any[]; }; }) => {
    const formattedData = aggregations.sales_over_time.buckets.map(
      (bucket: { key_as_string: any; doc_count: any; }) => ({
        date: bucket.key_as_string, // This will be the month in "MMMM" format (e.g., "January")
        mobile: bucket.doc_count, // This will be the count of documents for that month
      })
    );

    return formattedData;
  };

  const processAggregationEsign = (aggregations: { sales_over_time: { buckets: any[]; }; }) => {
    const formattedData = aggregations.sales_over_time.buckets.map(
      (bucket: { key_as_string: any; doc_count: any; }) => ({
        date: bucket.key_as_string, // This will be the month in "MMMM" format (e.g., "January")
        desktop: bucket.doc_count, // This will be the count of documents for that month
      })
    );

    return formattedData;
  };

  const processAggregationDelivery = (aggregations: { sales_over_time: { buckets: any[]; }; }) => {
    const formattedData = aggregations.sales_over_time.buckets.map(
      (bucket: { key_as_string: any; doc_count: any; }) => ({
        date: bucket.key_as_string, // This will be the month in "MMMM" format (e.g., "January")
        delivery: bucket.doc_count, // This will be the count of documents for that month
      })
    );

    return formattedData;
  };

  const processAggregationDuplicate = (aggregations: { sales_over_time: { buckets: any[]; }; }) => {
    const formattedData = aggregations.sales_over_time.buckets.map(
      (bucket: { key_as_string: any; doc_count: any; }) => ({
        date: bucket.key_as_string, // This will be the month in "MMMM" format (e.g., "January")
        duplicate: bucket.doc_count, // This will be the count of documents for that month
      })
    );

    return formattedData;
  };

  const handlePresetSelect = (preset: string) => {
    const now = new Date();
    let start: Date, end: Date;

    switch (preset) {
      case "today":
        start = new Date(now.setHours(0, 0, 0, 0));
        end = new Date(now.setHours(23, 59, 59, 999));
        break;
      case "yesterday":
        start = new Date(now);
        start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(now);
        end.setDate(end.getDate() - 1);
        end.setHours(23, 59, 59, 999);
        break;
      case "thisWeek":
        start = new Date(now.setDate(now.getDate() - now.getDay()));
        end = new Date(now.setDate(now.getDate() - now.getDay() + 6));
        end.setHours(23, 59, 59, 999);
        break;
      case "lastHour":
        start = new Date(now.setHours(now.getHours() - 2));
        end = new Date();
        break;
      default:
        return;
    }
    console.log(start, end);

    setStartDate(start);
    setEndDate(end);
    setSelectedPreset(preset);
  };

  const total = {
    desktop: chartData.reduce((acc, curr) => acc + curr.desktop, 0),
    mobile: chartData.reduce((acc, curr) => acc + curr.mobile, 0),
    delivery: chartData.reduce((acc, curr) => acc + curr.delivery, 0),
    duplicate: chartData.reduce((acc, curr) => acc + curr.duplicate, 0),
  };

  return (
    <main className="p-4">
      <Tabs defaultValue="account">
        <TabsList>
          <TabsTrigger value="account">Overview</TabsTrigger>
          <TabsTrigger value="password">Search</TabsTrigger>
        </TabsList>
        <TabsContent value="account">
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="flex space-x-4">
              <div className="flex space-x-4 mb-4">
                <Button
                  onClick={() => handlePresetSelect("today")}
                  variant={selectedPreset === "today" ? "default" : "outline"}
                >
                  Today
                </Button>
                <Button
                  onClick={() => handlePresetSelect("yesterday")}
                  variant={
                    selectedPreset === "yesterday" ? "default" : "outline"
                  }
                >
                  Yesterday
                </Button>
                <Button
                  onClick={() => handlePresetSelect("thisWeek")}
                  variant={
                    selectedPreset === "thisWeek" ? "default" : "outline"
                  }
                >
                  This Week
                </Button>
                <Button
                  onClick={() => handlePresetSelect("lastHour")}
                  variant={
                    selectedPreset === "lastHour" ? "default" : "outline"
                  }
                >
                  Last Hour
                </Button>
              </div>
              <DatePicker
                todayButton="Today"
                selected={startDate}
                onChange={(date: Date | null) => setStartDate(date)}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                timeCaption="time"
                dateFormat="MMMM d, yyyy h:mm aa"
                placeholderText="Select start date and time"
                className="p-2 border rounded"
              />
              <DatePicker
                selected={endDate}
                onChange={(date: Date | null) => setEndDate(date)}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                timeCaption="time"
                dateFormat="MMMM d, yyyy h:mm aa"
                placeholderText="Select end date and time"
                className="p-2 border rounded"
              />
              <Button type="submit" disabled={isLoading}>
                Submit
              </Button>
            </div>
          </form>
          {error && <div className="mt-4 text-red-500">{error}</div>}
          {chartData.length !== 0 && (
            <Chart chartData={chartData} total={total} />
          )}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96">
            {/* {totalHits !== null && (
              <ShadcnCard>
                <CardHeader>
                  <CardTitle>Partials</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{totalHits}</p>
                </CardContent>
              </ShadcnCard>
            )}
            {totalEsigns !== null && (
              <ShadcnCard>
                <CardHeader>
                  <CardTitle>Esigns</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{totalEsigns}</p>
                </CardContent>
              </ShadcnCard>
            )} */}
            {/* <Chart/> */}

            {startDate && endDate && (
              <UndeliveredSignsFinder
                startDate={startDate}
                endDate={endDate}
              />
            )}
            {startDate && endDate && (
              <DuplicateEmailFinder startDate={startDate} endDate={endDate} />
            )}
            {tableData.length > 0 ? (
              <ShadcnCard className="col-span-2">
                <CardHeader>
                  <CardTitle>Leads</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Email</TableHead>
                        {/* Add more TableHead components for additional columns */}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentPageData.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{row.timestamp}</TableCell>
                          <TableCell>{row.email}</TableCell>
                          {/* Add more TableCell components for additional columns */}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex justify-between items-center mt-4">
                    <Button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span>
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </CardContent>
              </ShadcnCard>
            ) : (
              <Card className="mt-4">
                <CardContent>No data available</CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        <TabsContent value="password">
          <Search />
        </TabsContent>
      </Tabs>
    </main>
  );
}
