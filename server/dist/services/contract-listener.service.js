const ethers = require('ethers');
const MiniLend = require('../contracts/MiniLend.json');
const LendingPool = require('../models/lending-pool.model');
const Loan = require('../models/loan.model');

const provider = new ethers.providers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC);
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, MiniLend.abi, provider);

contract.on('LoanRequested', async (loanId, borrower, amount) => {
  const loan = await Loan.findById(loanId);
  loan.status = 'Active';
  await loan.save();
});

contract.on('LoanPayout', async (loanId, borrower, amount) => {
  const loan = await Loan.findById(loanId);
  loan.status = 'Paid';
  await loan.save();
});

contract.on('LendingPoolCreated', async (poolId, name, totalFunds) => {
  const pool = new LendingPool({
    _id: poolId,
    name,
    totalFunds,
    availableFunds: totalFunds
  });
  await pool.save();
}); 