import React, { useState } from 'react'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import {
  ConnectionProvider,
  WalletProvider,
  useConnection,
  useWallet
} from '@solana/wallet-adapter-react'
import {
  WalletModalProvider,
  WalletMultiButton
} from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare'
import { clusterApiUrl, Connection, PublicKey as SolanaPublicKey } from '@solana/web3.js'
import { createMerkleTree, createTree, isValidDepthSizePair, ALL_DEPTH_SIZE_PAIRS, calculateCosts } from './lib/merkle-tree'
import { Button } from './components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'
import { useToast } from './hooks/use-toast'
import { Toaster } from './components/ui/toaster'

import '@solana/wallet-adapter-react-ui/styles.css'
import './styles/wallet.css'

const wallets = [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter()
]

function MerkleTreeCreator() {
  const [selectedDepthSizePair, setSelectedDepthSizePair] = useState<string>('5,8')
  const [canopyDepth, setCanopyDepth] = useState(0)
  const [isCreating, setIsCreating] = useState(false)
  const [customRpc, setCustomRpc] = useState('')
  const [detectedNetwork, setDetectedNetwork] = useState<'devnet' | 'mainnet' | null>(null)
  const [rpcVerified, setRpcVerified] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [configValid, setConfigValid] = useState<boolean | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [sourceCodeAvailable, setSourceCodeAvailable] = useState(false)
  const [completedTree, setCompletedTree] = useState<{
    treeAddress: string
    treeConfigAddress: string
    signature: string
    canopyDepth: number
    maxDepth: number
    maxBufferSize: number
    network: string
    timestamp: string
  } | null>(null)
  
  const { connection } = useConnection()
  const { publicKey, signTransaction, signAllTransactions } = useWallet()
  const { toast } = useToast()
  
  // Calculate and display all costs on component mount
  React.useEffect(() => {
    calculateCosts()
    checkSourceCodeAvailability()
  }, [])
  
  // Check if source code.zip is available
  const checkSourceCodeAvailability = async () => {
    try {
      const response = await fetch('/source code.zip', { method: 'HEAD' })
      setSourceCodeAvailable(response.ok)
    } catch (error) {
      setSourceCodeAvailable(false)
    }
  }

  const determineNetworkFromRpc = () => {
    const rpcToCheck = customRpc && customRpc.trim() ? customRpc.trim() : ''
    
    console.log('Determining network from RPC endpoint:', rpcToCheck)
    
    if (rpcToCheck.toLowerCase().includes('devnet')) {
      console.log('DEVNET detected from RPC URL')
      setDetectedNetwork('devnet')
    } else if (rpcToCheck.toLowerCase().includes('mainnet')) {
      console.log('MAINNET detected from RPC URL')
      setDetectedNetwork('mainnet')
    } else {
      // Default to devnet for testing
      console.log('No network specified in RPC, defaulting to DEVNET')
      setDetectedNetwork('devnet')
    }
  }

  // Reset states when wallet connects/disconnects
  React.useEffect(() => {
    if (publicKey) {
      // When wallet connects, determine network from RPC input or default to mainnet
      if (!detectedNetwork) {
        determineNetworkFromRpc()
      }
      setRpcVerified(false)
      setConfigValid(false)
    } else {
      setDetectedNetwork(null)
      setRpcVerified(false)
      setConfigValid(false)
    }
  }, [publicKey])
  
  // Update network when custom RPC changes
  React.useEffect(() => {
    if (publicKey) {
      determineNetworkFromRpc()
      setRpcVerified(false)
      setConfigValid(false)
    }
  }, [customRpc])

  const verifyRpcConnection = async () => {
    if (!customRpc?.trim()) {
      toast({
        title: "No RPC endpoint provided",
        description: "Please enter your RPC endpoint first",
        variant: "destructive"
      })
      return
    }

    setIsVerifying(true)
    setRpcVerified(false)
    
    try {
      console.log('Verifying RPC connection...')
      
      // Determine network first
      determineNetworkFromRpc()
      
      const targetEndpoint = customRpc.trim()
      console.log('Testing RPC endpoint:', targetEndpoint)
      
      // Create fresh connection to test the actual endpoint
      const testConnection = new Connection(targetEndpoint, 'confirmed')
      
      // Use the simplest possible test - just get the current slot
      const startTime = Date.now()
      const currentSlot = await testConnection.getSlot()
      const responseTime = Date.now() - startTime
      
      console.log('RPC responding, current slot:', currentSlot)
      console.log('Response time:', responseTime, 'ms')
      
      setRpcVerified(true)
      toast({
        title: "RPC Connection Verified",
        description: `${detectedNetwork?.toUpperCase() || 'Network'} RPC working - Slot: ${currentSlot.toLocaleString()}`,
      })
      
    } catch (error) {
      console.error('RPC verification failed:', error)
      let errorMessage = "Could not connect to RPC endpoint"
      
      if (error instanceof Error) {
        console.log('Full error:', error.message)
        
        if (error.message.includes('403') || error.message.includes('Forbidden')) {
          errorMessage = "403 Forbidden - API key may be invalid or missing permissions"
        } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          errorMessage = "401 Unauthorized - check your API key format"
        } else if (error.message.includes('400')) {
          errorMessage = "400 Bad Request - check RPC URL format"
        } else if (error.message.includes('fetch') || error.message.includes('network')) {
          errorMessage = "Network connection failed - check internet or URL"
        } else if (error.message.includes('Invalid URL')) {
          errorMessage = "Invalid RPC URL format"
        } else {
          errorMessage = `RPC Error: ${error.message.slice(0, 80)}...`
        }
      }
      
      toast({
        title: "RPC Verification Failed",
        description: errorMessage,
        variant: "destructive"
      })
      setRpcVerified(false)
    } finally {
      setIsVerifying(false)
    }
  }

  // Parse selected values
  const [maxDepth, maxBufferSize] = selectedDepthSizePair.split(',').map(Number)

  const validateTreeConfiguration = async () => {
    setIsValidating(true)
    
    try {
      console.log('Validating tree configuration...')
      console.log('Selected pair:', selectedDepthSizePair)
      console.log('Canopy Depth:', canopyDepth)
      console.log('Max Depth:', maxDepth)
      console.log('Max Buffer Size:', maxBufferSize)
      
      let validationErrors = []
      
      // Check if depth-size pair is valid (should always be valid from dropdown)
      if (!isValidDepthSizePair(maxDepth, maxBufferSize)) {
        validationErrors.push(`Invalid depth-size combination: (${maxDepth}, ${maxBufferSize}) is not supported by Solana`)
      }
      
      // Canopy depth validation
      if (canopyDepth >= maxDepth) {
        validationErrors.push('Canopy depth must be less than max depth')
      }
      
      if (canopyDepth < 0) {
        validationErrors.push('Canopy depth cannot be negative')
      }
      
      if (canopyDepth > 17) {
        validationErrors.push('Canopy depth cannot exceed 17 (Solana limit)')
      }
      
      // Check if buffer size is a power of 2
      if ((maxBufferSize & (maxBufferSize - 1)) !== 0) {
        validationErrors.push('Buffer size should be a power of 2 for optimal performance')
      }
      
      // Calculate total tree capacity and warn if excessive
      const maxLeaves = Math.pow(2, maxDepth)
      if (maxLeaves > 1000000000) {
        validationErrors.push('Tree capacity is extremely large - consider reducing max depth')
      }
      
      // Check canopy efficiency
      if (canopyDepth < 10 && maxDepth > 20) {
        validationErrors.push('Low canopy depth with high max depth may result in expensive proof verification')
      }
      
      if (validationErrors.length > 0) {
        setConfigValid(false)
        toast({
          title: "Configuration Issues Found",
          description: validationErrors[0] + (validationErrors.length > 1 ? ` (+${validationErrors.length - 1} more)` : ''),
          variant: "destructive"
        })
        console.log('Validation errors:', validationErrors)
      } else {
        setConfigValid(true)
        const capacity = Math.pow(2, maxDepth).toLocaleString()
        toast({
          title: "Configuration Valid",
          description: `Tree settings comply with Bubblegum standards. Capacity: ${capacity} leaves`,
        })
        console.log('✅ Configuration validated successfully')
      }
      
    } catch (error) {
      console.error('Validation error:', error)
      setConfigValid(false)
      toast({
        title: "Validation Failed",
        description: "Could not validate tree configuration",
        variant: "destructive"
      })
    } finally {
      setIsValidating(false)
    }
  }

  // Remove cost estimation

  const handleCreateTree = async () => {
    if (!publicKey || !signTransaction) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        variant: "destructive"
      })
      return
    }

    if (!rpcVerified || !configValid) {
      toast({
        title: "Setup incomplete",
        description: "Please verify RPC and validate configuration first",
        variant: "destructive"
      })
      return
    }

    setIsCreating(true)

    try {
      console.log('Creating Bubblegum Merkle tree with configuration:')
      console.log('- Canopy Depth:', canopyDepth)
      console.log('- Max Depth:', maxDepth)
      console.log('- Max Buffer Size:', maxBufferSize)
      console.log('- Network:', detectedNetwork)
      
      // Use the custom RPC connection if provided, otherwise use wallet connection
      const targetEndpoint = customRpc && customRpc.trim() ? customRpc.trim() : connection.rpcEndpoint
      const treeConnection = new Connection(targetEndpoint, 'confirmed')
      
      console.log('Using RPC for tree creation:', targetEndpoint)
      
      toast({
        title: "Creating Merkle Tree",
        description: "Please approve the transaction in your wallet",
      })

      const result = await createMerkleTree(
        treeConnection,
        publicKey,
        signTransaction,
        { canopyDepth, maxDepth, maxBufferSize }
      )

      // Store completed tree details
      setCompletedTree({
        treeAddress: result.treeAddress,
        treeConfigAddress: result.treeConfigAddress || result.treeAddress,
        signature: result.signature,
        canopyDepth,
        maxDepth,
        maxBufferSize,
        network: detectedNetwork || 'devnet',
        timestamp: new Date().toLocaleString()
      })

      toast({
        title: "Merkle Tree Created!",
        description: `Tree created successfully for CNFTs. Address: ${result.treeAddress.slice(0, 8)}...`,
      })

      console.log('✅ Merkle tree created successfully:')
      console.log('- Tree Address:', result.treeAddress)
      console.log('- Tree Config Address:', result.treeConfigAddress || result.treeAddress)
      console.log('- Transaction Signature:', result.signature)
      console.log('- Configuration Applied:', { canopyDepth, maxDepth, maxBufferSize })
      console.log('- Network:', detectedNetwork)

    } catch (error) {
      console.error('❌ Merkle tree creation failed:', error)
      
      let errorMessage = "Failed to create Merkle tree"
      if (error instanceof Error) {
        if (error.message.includes('User rejected') || error.message.includes('rejected')) {
          errorMessage = "Transaction was rejected in wallet"
        } else if (error.message.includes('insufficient funds') || error.message.includes('balance')) {
          errorMessage = "Insufficient SOL balance for tree creation"
        } else if (error.message.includes('simulation failed')) {
          errorMessage = "Transaction simulation failed - check account permissions and balance"
        } else if (error.message.includes('blockhash') || error.message.includes('expired')) {
          errorMessage = "Transaction expired - please try again"
        } else if (error.message.includes('RPC') || error.message.includes('network')) {
          errorMessage = "RPC connection error - check your endpoint"
        } else if (error.message.includes('SPL Account Compression')) {
          errorMessage = "Account Compression program error - check configuration"
        } else {
          errorMessage = error.message.slice(0, 100)
        }
      }
      
      toast({
        title: "Tree Creation Failed",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="mb-4">
            <button
              onClick={() => window.open('https://github.com/yourusername/soltreez', '_blank')}
              className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors"
            >
              📦 View on GitHub
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">SolTreez</h1>
          <p className="text-gray-600">Simple Solana Merkle Tree Creator for Compressed NFTs</p>
          {!publicKey && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                Connect your wallet to get started. Network will be determined from your RPC endpoint.
              </p>
            </div>
          )}
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Wallet Connection</CardTitle>
            <CardDescription>Connect your Solana wallet to create trees</CardDescription>
          </CardHeader>
          <CardContent>
            <WalletMultiButton className="!bg-blue-600 hover:!bg-blue-700" />
            {publicKey && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700">
                  Wallet connected - Network: {detectedNetwork ? detectedNetwork.toUpperCase() : 'Please set RPC endpoint'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {publicKey && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>RPC Configuration</CardTitle>
                <CardDescription>
                  Enter your RPC endpoint - network will be auto-detected from URL
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custom RPC Endpoint (optional)
                    </label>
                    <input
                      type="text"
                      value={customRpc}
                      onChange={(e) => setCustomRpc(e.target.value)}
                      placeholder="Enter your RPC endpoint (e.g., https://mainnet.helius-rpc.com/?api-key=xxx or https://api.devnet.solana.com)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Network will be determined from your RPC URL. Include 'devnet' for devnet or 'mainnet' for mainnet.
                    </p>
                  </div>
                  <Button
                    onClick={verifyRpcConnection}
                    disabled={isVerifying || !customRpc.trim()}
                    className="w-full mt-4"
                    variant={rpcVerified ? "default" : "outline"}
                  >
                    {isVerifying ? 'Verifying RPC...' : rpcVerified ? 'RPC Verified ✓' : 'Verify RPC Connection'}
                  </Button>
                  {rpcVerified && detectedNetwork && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-700">
                        RPC connection verified for {detectedNetwork.toUpperCase()}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {rpcVerified && (
              <>
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Tree Configuration</CardTitle>
                    <CardDescription>Adjust the settings for your Merkle tree</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tree Size Configuration
                        </label>
                        <select
                          value={selectedDepthSizePair}
                          onChange={(e) => setSelectedDepthSizePair(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {ALL_DEPTH_SIZE_PAIRS.map(([depth, bufferSize]) => {
                            const maxNFTs = Math.pow(2, depth).toLocaleString()
                            return (
                              <option key={`${depth},${bufferSize}`} value={`${depth},${bufferSize}`}>
                                Depth {depth}, Buffer {bufferSize} - Max {maxNFTs} NFTs
                              </option>
                            )
                          })}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          Pre-validated combinations that comply with Solana standards.
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Canopy Depth: {canopyDepth}
                        </label>
                        <select
                          value={canopyDepth.toString()}
                          onChange={(e) => setCanopyDepth(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {Array.from({ length: Math.min(18, maxDepth) }, (_, i) => i).map((depth) => (
                            <option key={depth} value={depth.toString()}>
                              {depth} - Proof size: {maxDepth - depth} levels
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          Canopy depth reduces proof sizes but increases storage cost.
                        </p>
                      </div>

                      <div className="p-3 bg-blue-50 rounded-lg">
                        <h4 className="text-sm font-semibold text-blue-800 mb-1">Current Configuration:</h4>
                        <div className="text-xs text-blue-700 space-y-1">
                          <div>Max Depth: {maxDepth} | Buffer Size: {maxBufferSize}</div>
                          <div>Max NFTs: {Math.pow(2, maxDepth).toLocaleString()}</div>
                          <div>Proof Size: {maxDepth - canopyDepth} levels</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Button
                  onClick={validateTreeConfiguration}
                  disabled={isValidating}
                  className="w-full mt-4"
                  variant={configValid === true ? "default" : "outline"}
                >
                  {isValidating ? 'Checking Configuration...' : configValid === true ? 'Configuration Valid ✓' : 'Check Configuration'}
                </Button>
                
                {isValidating && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      🔍 Validating against official Solana depth-size pairs...
                    </p>
                  </div>
                )}



                {configValid === true && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-700">
                      ✅ Valid depth-size pair confirmed by Solana standards
                    </p>
                  </div>
                )}

                {configValid === true && (
                  <Button 
                    onClick={handleCreateTree}
                    disabled={!publicKey || isCreating || !rpcVerified || configValid !== true || !customRpc.trim()}
                    className="w-full h-12 text-lg bg-purple-600 hover:bg-purple-700"
                  >
                    {isCreating ? 'Creating Merkle Tree...' : 'Create Merkle Tree'}
                  </Button>
                )}

                {completedTree && (
                  <Card className="mt-6 border-green-200 bg-green-50">
                    <CardHeader>
                      <CardTitle className="text-green-800">Transaction Completed Successfully!</CardTitle>
                      <CardDescription className="text-green-700">
                        Your Merkle tree has been created on {completedTree.network.toUpperCase()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 text-sm">
                        <div className="p-3 bg-white rounded border">
                          <strong className="text-gray-700">Tree Account:</strong>
                          <div className="font-mono text-blue-600 break-all mt-1">
                            {completedTree.treeAddress}
                          </div>
                        </div>
                        
                        <div className="p-3 bg-white rounded border">
                          <strong className="text-gray-700">Tree Config Account:</strong>
                          <div className="font-mono text-blue-600 break-all mt-1">
                            {completedTree.treeConfigAddress}
                          </div>
                        </div>
                        
                        <div className="p-3 bg-white rounded border">
                          <strong className="text-gray-700">Transaction Signature:</strong>
                          <div className="font-mono text-blue-600 break-all mt-1">
                            {completedTree.signature}
                          </div>
                        </div>
                        
                        <div className="p-3 bg-white rounded border">
                          <strong className="text-gray-700">Created:</strong>
                          <div className="mt-1">{completedTree.timestamp}</div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3">
                          <div className="p-3 bg-white rounded border">
                            <strong className="text-gray-700">Max Depth:</strong>
                            <div className="mt-1">{completedTree.maxDepth}</div>
                          </div>
                          <div className="p-3 bg-white rounded border">
                            <strong className="text-gray-700">Canopy Depth:</strong>
                            <div className="mt-1">{completedTree.canopyDepth}</div>
                          </div>
                          <div className="p-3 bg-white rounded border">
                            <strong className="text-gray-700">Buffer Size:</strong>
                            <div className="mt-1">{completedTree.maxBufferSize}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6 p-4 bg-green-50 rounded border border-green-200">
                        <h4 className="font-semibold text-green-800 mb-2">Ready for CNFT Minting:</h4>
                        <div className="text-sm text-green-700 space-y-2">
                          <div><strong>Merkle Tree ID:</strong> <span className="font-mono text-xs break-all">{completedTree.treeAddress}</span></div>
                          <div><strong>Maximum CNFTs:</strong> {Math.pow(2, completedTree.maxDepth).toLocaleString()}</div>
                          <div><strong>Proof Size:</strong> {completedTree.maxDepth - completedTree.canopyDepth} levels (lower = cheaper mints)</div>
                          <div><strong>Network:</strong> {completedTree.network.toUpperCase()}</div>
                        </div>
                        <div className="mt-3 p-2 bg-white rounded text-xs">
                          <strong>For developers:</strong> Use this tree address when calling mint instructions with the Bubblegum program to create compressed NFTs.
                        </div>
                      </div>
                      
                      <div className="mt-4 text-center">
                        <a
                          href={`https://explorer.solana.com/address/${completedTree.treeAddress}${completedTree.network === 'devnet' ? '?cluster=devnet' : ''}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
                        >
                          View on Solana Explorer
                        </a>
                      </div>
                      
                      <Button 
                        onClick={() => setCompletedTree(null)}
                        variant="outline"
                        className="w-full mt-4"
                      >
                        Create Another Tree
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </>
        )}
      </div>
      <Toaster />
    </div>
  )
}

export default function App() {
  // Use mainnet by default since app should support both networks
  const network = WalletAdapterNetwork.Mainnet
  const endpoint = clusterApiUrl(network)

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <MerkleTreeCreator />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}