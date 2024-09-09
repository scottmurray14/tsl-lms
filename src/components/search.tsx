'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from 'next/link'
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog" // Import dialog components
import { SquareArrowOutUpRight as InfoIcon } from "lucide-react"

export default function Search({ initialEmail }: { initialEmail?: string | null }) {
  const [searchText, setSearchText] = useState(initialEmail || '')
  const [searchField, setSearchField] = useState('email_address')
  const [results, setResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedResult, setSelectedResult] = useState<any | null>(null) // State for selected result

  useEffect(() => {
    if (initialEmail) {
      handleSearch();
    }
  }, [initialEmail]);

  const handleSearch = async () => {
    if (!searchText) {
      setError('Please enter a search term')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await axios.post('/api/opensearch', {
        query: {
          match: {
            [searchField]: searchText
          }
        }
      })

      setResults(response.data.hits.hits)
    } catch (err) {
      setError('An error occurred while searching')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const openDialog = (result: any) => {
    setSelectedResult(result)
  }

  return (
    <Card className="w-full max-w-5xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Lead Search</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-4 mb-4">
          <Input
            type="text"
            placeholder="Enter search text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Select value={searchField} onValueChange={setSearchField}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select field" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="email_address">Email Address</SelectItem>
              <SelectItem value="telephone_number">Telephone</SelectItem>
              <SelectItem value="postcode">Postcode</SelectItem>
              <SelectItem value="timestamp">Timestamp</SelectItem>
              <SelectItem value="esign_timestamp">E-Sign Timestamp</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleSearch} disabled={isLoading}>
            {isLoading ? 'Searching...' : 'Search'}
          </Button>
        </div>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        {results.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telephone</TableHead>
                <TableHead>Timestamp</TableHead>      
                <TableHead>Postcode</TableHead>                
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="flex items-center"> {/* Flex container for alignment */}
                       {/* Link wrapping both elements */}
                       <Link target="_blank" href={`https://eu-west-1.console.aws.amazon.com/dynamodbv2/home?region=eu-west-1#edit-item?itemMode=2&pk=${result._source['product']}&route=ROUTE_ITEM_EXPLORER&sk=${result._source['timestamp']}&table=leads-prod`} className="flex items-center">
                          <InfoIcon className='w-4 h-4 mr-1 hover:text-blue-500' />
                      </Link>
                      <span className='cursor-pointer' onClick={() => openDialog(result._source)}>{result._source['timestamp']}</span>
                    </div>
                  </TableCell>
                  <TableCell>{new Date(result._source['timestamp']).toLocaleString()}</TableCell>
                  <TableCell>{result._source['product']}</TableCell>
                  <TableCell>{result._source['email_address']}</TableCell>
                  <TableCell>{result._source['telephone_number']}</TableCell>
                  <TableCell>{result._source['esign_timestamp']}</TableCell>
                  <TableCell>{result._source['postcode']}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {results.length === 0 && !isLoading && (
          <p className="text-center text-gray-500">No results found</p>
        )}

        {/* Dialog to show OpenSearch data */}
        <Dialog open={!!selectedResult} onOpenChange={() => setSelectedResult(null)}>
          <DialogTrigger />
          <DialogContent>
            {selectedResult && (
              <div>
                <pre>{JSON.stringify(selectedResult, null, 2)}</pre> {/* Display data */}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}