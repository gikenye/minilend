
# MiniLend by Pesabits - Instant Loans on Celo

A seamless, collateral-free lending platform built for MiniPay, offering instant loans in local currency (cKES) backed by your Celo stablecoin savings.

## 🚀 Project Overview

MiniLend revolutionizes micro-lending by:
- Providing instant access to local currency loans (cKES)
- Using your Celo stablecoin savings as security
- Eliminating paperwork and lengthy approval processes
- Offering flexible repayment in 3 easy installments

## 💡 Business Logic

### Core Features
- **Instant Loans**: Get quick access to cKES loans backed by your Celo stablecoin balance
- **Flexible Repayment**: 3-installment repayment structure with clear schedules
- **Yield Generation**: Earn interest by providing liquidity to the lending pool
- **Real-time Tracking**: Monitor loan status, repayments, and earnings

### Smart Contract Architecture
- Secure lending pool management
- Automated interest calculation and distribution
- Risk-managed collateral system using Celo stablecoins
- Event-driven loan state tracking

## 🔧 Technical Stack

### Frontend
- Next.js 14 (App Router)
- TypeScript
- TailwindCSS
- shadcn/ui Components
- Viem for Web3 interactions

### Blockchain
- Celo Network (Alfajores Testnet)
- Smart Contracts in Solidity
- Hardhat Development Framework

## 🌟 MiniPay Compatibility

This dApp is fully compatible with MiniPay, featuring:
- Native integration with MiniPay wallet
- Support for Celo stablecoins (cUSD, cEUR, cREAL)
- Gas fee abstraction (pay fees in stablecoins)
- Automatic wallet connection in MiniPay environment

## 🔒 Supported Tokens
- cUSD (Collateral)
- cKES (Loan Currency)
- Gas fees payable in any supported stablecoin

## ⚡ Getting Started

1. Clone the repository:
```bash
git clone https://github.com/gikenye/robinhood.git
cd robinhood
```

2. Install dependencies:
```bash
npm install
```

3. Run development server:
```bash
npm run dev
```

## 🧪 Testing with MiniPay

1. Start your local server:
```bash
npm run dev
```

2. Expose with ngrok:
```bash
ngrok http 3000
```

3. In MiniPay:
   - Enable Developer Mode
   - Enter your ngrok URL
   - Test the dApp functionality

## 🔧 Environment Setup

1. Set up environment variables:
```env
NEXT_PUBLIC_WC_PROJECT_ID=your_wallet_connect_project_id
NEXT_PUBLIC_API_URL=http://localhost:5001
```

2. Smart Contract Configuration:
- Contract Interface: `@celo/abis` v1+ required
- Contract Address: `0x164E90869634ADd3891BBfB8d410B0742f899826`
- Network: Celo Alfajores Testnet
- RPC URL: https://alfajores-forno.celo-testnet.org
- Required Libraries: Viem v2+

3. Pool Configuration:
- Interest Rate: 10% APR (1000 BPS)
- Maximum Rate: 20% APR (2000 BPS)
- Supported Tokens: cUSD, cEUR, cREAL, USDC (testnet)

## 🚀 Deployment

### Frontend Deployment
1. Build the project:
```bash
yarn build
```

2. Deploy to your preferred hosting platform:
- Vercel (recommended)
- Netlify
- GitHub Pages

### Smart Contract Deployment
1. Configure Hardhat network:
```bash
npx hardhat compile
npx hardhat deploy --network alfajores
```

2. Verify contract:
```bash
npx hardhat verify --network alfajores [CONTRACT_ADDRESS]
```

## 🔒 Security Features

### Smart Contract Security
- Access Control: Owner-only admin functions
- Base Interest Rate: 10% APR (1000 BPS)
- Maximum Interest Rate: 20% APR (2000 BPS)
- Amount Validation: Non-zero checks
- Liquidity Protection: Pool balance checks
- Gas Fee Abstraction: MiniPay compatible

### User Security
- Non-custodial: User controls funds
- Automated Interest: Time-based accrual
- Pool Protection: Per-token isolation
- Yield Distribution: Share-based allocation
- Real-time Monitoring: Event emission

## 🌐 Network Configuration

### Mainnet
- Chain ID: 0x42220
- RPC URL: https://forno.celo.org
- Explorer: https://celoscan.io

### Testnet (Alfajores)
- Chain ID: 0xaef3
- RPC URL: https://alfajores-forno.celo-testnet.org
- Explorer: https://alfajores.celoscan.io

## 💳 Supported Tokens & Networks

### Mainnet
- cUSD (Celo Dollar): `0x765DE816845861e75A25fCA122bb6898B8B1282a`
- cEUR (Celo Euro): `0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73`
- cREAL (Celo Real): `0xE4D517785D091D3c54818832dB6094bcc2744545`

### Testnet (Alfajores)
- cUSD (Celo Dollar): `0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1`
- cEUR (Celo Euro): `0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F`
- cREAL (Celo Real): `0xE4D517785D091D3c54818832dB6094bcc2744545`
- USDC (USD Coin): `0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B`

## 🔒 Smart Contract Features

### Core Parameters
- Base Interest Rate: 10% APR (1000 basis points)
- Maximum Rate Cap: 20% APR (2000 basis points)
- Interest Model: Simple interest calculation
- Interest Period: 365 days annual rate

### Pool Management 
- Independent liquidity pools per token
- Total deposits tracking
- User deposit accounting
- Yield distribution based on pool share
- Auto-repayment from earned yield

### Lending Features
- Active loan tracking per user and token
- Principal and interest accounting
- Time-based interest accrual
- Partial repayment support
- Auto loan closure on full repayment

### Security Features
- Owner-only admin functions 
- Input validation on all amounts
- Token whitelist system
- Balance checks before transfers
- Pool liquidity verification
- Timestamp-based calculations
- MiniPay gas fee abstraction

### Data Structures
- Loan: {active, principal, interestAccrued, lastUpdate}
- Yields: {grossYield, netYield, usedForLoanRepayment}
- PoolState: {totalDeposits, totalPool, userDeposits, userWithdrawn, userYieldClaimed}

### Events Emitted
- Deposit(user, token, amount)
- Withdraw(user, token, amount) 
- LoanCreated(user, token, amount)
- LoanRepaid(user, token, amount)

### Admin Controls
- Contract owner management
- Interest rate updates (max 20% APR)
- Stablecoin whitelist management

### Gas Optimization 
- View functions for gas-free queries
- Minimal state updates
- Optimized data structures
- Native MiniPay fee abstraction

## 🛠️ Core Features

### Lending Protocol
- Interest Model: Simple interest calculation
- Time-based Interest: 365-day annual rate
- Pool Management: Independent token pools
- Yield Distribution: Proportional to deposits
- Auto Interest Settlement: From yield earnings

### User Features
- Multi-token Deposits: All supported stablecoins
- Flexible Borrowing: Up to pool liquidity
- Automated Interest: Time-based accrual
- Yield Earning: Pool share mechanics
- Dynamic Withdrawals: Principal + earned yield

### User Experience
- Mobile-first design
- Dark/Light mode support
- Multi-language (EN/SW)
- Real-time notifications
- Transaction history

## 🔜 Future Updates

- Variable interest rates
- Multiple collateral types
- Cross-chain expansion
- Governance token (MLEND)
- Referral program
- Extended loan terms

## 📜 License

MIT License - see LICENSE file for details

## 📚 Dependencies

- Node.js 18+
- TypeScript 5+
- Viem 2+
- Hardhat
- @celo/contractkit

## 🔗 References

- [MiniPay Documentation](https://docs.mintbase.xyz/minipay/)
- [Celo Developer Documentation](https://docs.celo.org/)
- [Viem Documentation](https://viem.sh/)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
