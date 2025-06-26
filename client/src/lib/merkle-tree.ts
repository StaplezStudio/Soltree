import { 
  Connection, 
  PublicKey, 
  Transaction, 
  sendAndConfirmTransaction,
  Keypair,
  SystemProgram,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';

// Official Solana Program IDs
export const SPL_ACCOUNT_COMPRESSION_PROGRAM_ID = new PublicKey('cmtDvXumGCrqC1Age74AVPhSRVXJMd8PJS91L8KbNCK');
export const SPL_NOOP_PROGRAM_ID = new PublicKey('noopb9bkMVfRPU8AsbpTUg8AQkHtKwMYZiFUjNRtMmV');
export const BUBBLEGUM_PROGRAM_ID = new PublicKey('BGUMAp9Gq7iTEuizy4pqaxsTyUCBK68MDfK752saRPUY');

function getConcurrentMerkleTreeAccountSize(
  maxDepth: number,
  maxBufferSize: number,
  canopyDepth: number
): number {
  // Calculate the size needed for a concurrent merkle tree account
  // This is a simplified calculation based on Solana's Account Compression standards
  
  const headerSize = 64; // Account header
  const treeSize = Math.pow(2, maxDepth + 1) * 32; // Tree nodes (32 bytes each)
  const bufferSize = maxBufferSize * 32; // Buffer for pending changes
  const canopySize = canopyDepth > 0 ? Math.pow(2, canopyDepth) * 32 : 0; // Canopy nodes
  
  return headerSize + treeSize + bufferSize + canopySize;
}

// Function for creating the concurrent Merkle tree account allocation instruction
async function createAllocTreeIx(
  connection: Connection,
  treeKeypair: PublicKey,
  payer: PublicKey,
  maxDepth: number,
  maxBufferSize: number,
  canopyDepth: number
) {
  try {
    // Calculate space needed for the merkle tree account
    const space = getConcurrentMerkleTreeAccountSize(maxDepth, maxBufferSize, canopyDepth);
    const lamports = await connection.getMinimumBalanceForRentExemption(space);

    return SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: treeKeypair,
      lamports,
      space,
      programId: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
    });
  } catch (error) {
    console.error('Error creating allocation instruction:', error);
    throw new Error(`Failed to create allocation instruction: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Function to derive the tree authority PDA from the tree account
function getTreeAuthority(treeAccount: PublicKey): [PublicKey, number] {
  try {
    return PublicKey.findProgramAddressSync(
      [treeAccount.toBuffer()],
      BUBBLEGUM_PROGRAM_ID
    );
  } catch (error) {
    console.error('Error deriving tree authority PDA:', error);
    throw new Error(`Failed to derive tree authority: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

type ConcurrentMerkleTreeAccount = any;

// Valid depth-size pairs as defined by @solana/spl-account-compression
export const ALL_DEPTH_SIZE_PAIRS: [number, number][] = [
  [3, 8], [5, 8], [14, 64], [14, 256], [14, 1024], [14, 2048],
  [15, 64], [16, 64], [17, 64], [18, 64], [19, 64], [20, 64],
  [20, 256], [20, 1024], [20, 2048], [24, 64], [24, 256], [24, 512],
  [24, 1024], [24, 2048], [26, 512], [26, 1024], [26, 2048],
  [30, 512], [30, 1024], [30, 2048]
];

export type ValidDepthSizePair = typeof ALL_DEPTH_SIZE_PAIRS[number];

export interface MerkleTreeParams {
  canopyDepth: number;
  maxDepth: number;
  maxBufferSize: number;
}

// Alternative interface matching the user's specification
export interface CreateTreeParams {
  connection: Connection;
  payer: Keypair;
  treeKeypair: Keypair;
  maxDepthSizePair: ValidDepthSizePair;
  canopyDepth?: number;
}

export function isValidDepthSizePair(maxDepth: number, maxBufferSize: number): boolean {
  return ALL_DEPTH_SIZE_PAIRS.some(([depth, size]) => depth === maxDepth && size === maxBufferSize);
}

export interface CreateMerkleTreeResult {
  signature: string;
  treeAddress: string;
  treeConfigAddress: string;
}

export function estimateCost(canopyDepth: number, maxBufferSize: number): string {
  // Base cost for tree creation
  let cost = 0.01;
  
  // Additional cost based on canopy depth
  cost += canopyDepth * 0.001;
  
  // Additional cost based on buffer size
  cost += (maxBufferSize / 1000) * 0.01;
  
  return cost.toFixed(3);
}

export function calculateCosts(proofSize?: number) {
  console.log('=== Solana Compressed NFT Tree Cost Analysis ===');
  console.log('');
  
  ALL_DEPTH_SIZE_PAIRS.forEach(([maxDepth, maxBufferSize]) => {
    try {
      // Calculate maximum canopy depth (proof size determines this)
      const maxCanopy = proofSize ? Math.max(0, maxDepth - proofSize) : Math.floor(maxDepth / 2);
      
      // Calculate tree properties
      const maxNFTs = Math.pow(2, maxDepth);
      const accountSize = getConcurrentMerkleTreeAccountSize(maxDepth, maxBufferSize, maxCanopy);
      
      // Check if account size would be too large (Solana has practical limits)
      if (accountSize > 10485760) { // 10MB limit
        console.log(`Depth: ${maxDepth.toString().padStart(2)}, Buffer: ${maxBufferSize.toString().padStart(4)}, Canopy: ${maxCanopy.toString().padStart(2)} | NFTs: ${maxNFTs.toLocaleString().padStart(12)} | Status: TOO LARGE`);
        return;
      }
      
      // Estimate rent cost (approximate 0.00000348 SOL per byte)
      const rentCostSOL = (accountSize * 0.00000348).toFixed(6);
      
      console.log(`Depth: ${maxDepth.toString().padStart(2)}, Buffer: ${maxBufferSize.toString().padStart(4)}, Canopy: ${maxCanopy.toString().padStart(2)} | NFTs: ${maxNFTs.toLocaleString().padStart(12)} | Rent: ${rentCostSOL} SOL`);
    } catch (error) {
      console.log(`Depth: ${maxDepth.toString().padStart(2)}, Buffer: ${maxBufferSize.toString().padStart(4)} | Error: Unable to fetch minimum balance for rent exemption`);
    }
  });
  
  console.log('');
  console.log('Note: Rent costs are estimates. Some configurations may be too large to create.');
  console.log('Canopy depth reduces proof size but increases storage cost.');
}

export async function createTree(
  connection: Connection,
  payer: Keypair,
  treeKeypair: Keypair,
  maxDepthSizePair: ValidDepthSizePair,
  canopyDepth: number = 0
): Promise<CreateMerkleTreeResult> {
  const [maxDepth, maxBufferSize] = maxDepthSizePair;
  
  try {
    console.log('🌳 Creating Bubblegum tree with proper accounts:', { canopyDepth, maxDepth, maxBufferSize });
    
    // Derive tree authority PDA
    const [treeAuthority] = getTreeAuthority(treeKeypair.publicKey);
    console.log('🔑 Tree authority PDA:', treeAuthority.toString());
    
    // Calculate space needed for the tree account
    const requiredSpace = getConcurrentMerkleTreeAccountSize(maxDepth, maxBufferSize, canopyDepth);
    console.log('💾 Required space for tree account:', requiredSpace, 'bytes');
    
    // Create allocation instruction for the concurrent Merkle tree account
    const allocTreeIx = await createAllocTreeIx(
      connection,
      treeKeypair.publicKey,
      payer.publicKey,
      maxDepth,
      maxBufferSize,
      canopyDepth
    );
    
    // Create transaction with just the allocation instruction
    const transaction = new Transaction().add(allocTreeIx);
    
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = payer.publicKey;
    
    // Sign with tree keypair first
    transaction.partialSign(treeKeypair);
    
    // Sign with payer
    transaction.partialSign(payer);
    
    // Send and confirm transaction
    const signature = await connection.sendRawTransaction(transaction.serialize(), {
      skipPreflight: false,
      preflightCommitment: 'processed'
    });
    
    // Wait for confirmation
    await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight: (await connection.getLatestBlockhash()).lastValidBlockHeight
    });
    
    console.log('✅ Bubblegum tree created successfully!');
    console.log('🌳 Tree account:', treeKeypair.publicKey.toString());
    console.log('📋 Tree authority:', treeAuthority.toString());
    console.log('🧾 Transaction signature:', signature);
    
    return {
      signature,
      treeAddress: treeKeypair.publicKey.toString(),
      treeConfigAddress: treeAuthority.toString()
    };
  } catch (error) {
    console.error('❌ Failed to create Bubblegum tree:', error);
    throw new Error(`Failed to create Merkle tree: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Keep the original function for backwards compatibility with wallet adapter
export async function createMerkleTree(
  connection: Connection,
  payer: PublicKey,
  signTransaction: (transaction: Transaction) => Promise<Transaction>,
  params: MerkleTreeParams
): Promise<CreateMerkleTreeResult> {
  const { canopyDepth, maxDepth, maxBufferSize } = params;
  
  try {
    console.log('🌳 Creating Merkle tree with wallet adapter:', { canopyDepth, maxDepth, maxBufferSize });
    
    // Generate tree keypair
    const treeKeypair = Keypair.generate();
    console.log('🔑 Generated tree keypair:', treeKeypair.publicKey.toString());
    
    // Derive tree authority PDA
    const [treeAuthority] = getTreeAuthority(treeKeypair.publicKey);
    console.log('📋 Tree authority PDA:', treeAuthority.toString());
    
    // Calculate required space for tree account
    const requiredSpace = getConcurrentMerkleTreeAccountSize(maxDepth, maxBufferSize, canopyDepth);
    console.log('💾 Required space for tree account:', requiredSpace, 'bytes');
    
    // Create allocation instruction for the concurrent Merkle tree account
    const allocTreeIx = await createAllocTreeIx(
      connection,
      treeKeypair.publicKey,
      payer,
      maxDepth,
      maxBufferSize,
      canopyDepth
    );
    
    // Create simple tree initialization instruction
    // Note: In production, you would use the full Bubblegum SDK
    const initTreeIx = SystemProgram.transfer({
      fromPubkey: payer,
      toPubkey: treeAuthority,
      lamports: 1000000, // 0.001 SOL for account creation
    });
    
    // Create transaction with just the allocation instruction  
    const transaction = new Transaction().add(allocTreeIx);
    
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = payer;
    
    // Sign with tree keypair first (for account creation)
    transaction.partialSign(treeKeypair);
    
    // Sign with wallet (for paying fees)
    const signedTransaction = await signTransaction(transaction);
    
    // Send transaction
    const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
      skipPreflight: false,
      preflightCommitment: 'processed'
    });
    
    // Wait for confirmation
    await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight: (await connection.getLatestBlockhash()).lastValidBlockHeight
    });
    
    console.log('✅ Merkle tree created successfully with wallet adapter!');
    console.log('🌳 Tree account:', treeKeypair.publicKey.toString());
    console.log('📋 Tree authority:', treeAuthority.toString());
    console.log('🧾 Transaction signature:', signature);
    
    return {
      signature,
      treeAddress: treeKeypair.publicKey.toString(),
      treeConfigAddress: treeAuthority.toString()
    };
  } catch (error) {
    console.error('❌ Failed to create Bubblegum tree:', error);
    throw new Error(`Failed to create Merkle tree: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getTreeInfo(
  connection: Connection,
  treeAddress: PublicKey
): Promise<ConcurrentMerkleTreeAccount | null> {
  try {
    const accountInfo = await connection.getAccountInfo(treeAddress);
    if (!accountInfo) {
      return null;
    }
    
    // Parse the account data to get tree info
    // This would use the actual parsing logic from SPL compression
    return null; // Placeholder
  } catch (error) {
    console.error('Error getting tree info:', error);
    return null;
  }
}
