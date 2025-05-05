// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title MiniLend — Celo MiniPay-Compatible Lending Pool
/// @author 0x45😎
/// @notice Deposit, borrow, and withdraw cUSD/cEUR/cREAL with automated loan interest and yield.
/// @custom:requires @celo/abis v1+, Viem v2+
/// @custom:see https://docs.celo.org/build/build-on-minipay/code-library Code Library snippets for fee abstraction :contentReference[oaicite:3]{index=3}
contract MiniLend {
    /*//////////////////////////////////////////////////////////////
                          DATA STRUCTURES
    //////////////////////////////////////////////////////////////*/

    /// @notice Represents an active loan for a user
    struct Loan {
        bool    active;
        uint256 principal;
        uint256 interestAccrued;
        uint256 lastUpdate;
    }

    /// @notice Detailed yield breakdown for a depositor
    struct Yields {
        uint256 grossYield;
        uint256 netYield;
        uint256 usedForLoanRepayment;
    }

    /// @notice Per‐token pool state, tracking deposits and yield accounting
    struct PoolState {
        uint256 totalDeposits;            // Total principal deposited
        uint256 totalPool;                // Total pool (principal + interest)
        mapping(address => uint256) userDeposits;
        mapping(address => uint256) userWithdrawn;
        mapping(address => uint256) userYieldClaimed;
    }

    /*//////////////////////////////////////////////////////////////
                             STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice Contract owner (super-admin)
    address public owner;

    /// @notice Mapping token address → PoolState
    mapping(address => PoolState) internal pools;

    /// @notice Mapping user → token → active Loan
    mapping(address => mapping(address => Loan)) public userLoans;

    /// @notice Allowed stablecoins (cUSD, cEUR, cREAL)
    mapping(address => bool) public approvedStablecoins;

    /// @notice List of whitelisted stablecoin addresses
    address[] public stablecoinList;

    /// @notice Basis‐points interest rate (e.g. 1000 = 10% APR)
    uint256 public annualRateBps = 1000;
    uint256 public constant BPS = 10_000;

    // Mainnet MiniPay stablecoins
    // address constant CUSD  = 0x765DE816845861e75A25fCA122bb6898B8B1282a;
    // address constant CEUR  = 0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73;
    // address constant CREAL = 0xE4D517785D091D3c54818832dB6094bcc2744545;

    //Alfajores 
    address constant CUSD  = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;
    address constant CEUR  = 0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F;
    address constant CREAL = 0xE4D517785D091D3c54818832dB6094bcc2744545;
    address constant USDC  = 0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B;


    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Emitted when a user deposits into the pool
    event Deposit(address indexed user, address indexed token, uint256 amount);

    /// @notice Emitted when a user withdraws from the pool
    event Withdraw(address indexed user, address indexed token, uint256 amount);

    /// @notice Emitted when a loan is created
    event LoanCreated(address indexed user, address indexed token, uint256 amount);

    /// @notice Emitted when a loan repayment occurs
    event LoanRepaid(address indexed user, address indexed token, uint256 amount);

    /*//////////////////////////////////////////////////////////////
                               MODIFIERS
    //////////////////////////////////////////////////////////////*/

    /// @notice Restricts functions to the contract owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

   /// @notice Sets owner, initial APR, and whitelists default stablecoins
    /// @param _annualRateBps  Initial annual interest rate in basis points (e.g. 500 = 5%)
    constructor(uint256 _annualRateBps) {
        owner = msg.sender;
        annualRateBps = _annualRateBps;
        _addStablecoin(CUSD);
        _addStablecoin(CEUR);
        _addStablecoin(CREAL);
        _addStablecoin(USDC);
    }

    /*//////////////////////////////////////////////////////////////
                          STABLECOIN MANAGEMENT
    //////////////////////////////////////////////////////////////*/

    /// @notice Whitelist a new stablecoin
    /// @param token The ERC-20 token address to approve
    /// @dev Owner only. Adds to `stablecoinList`.
    function _addStablecoin(address token) internal onlyOwner {
        if (!approvedStablecoins[token]) {
            approvedStablecoins[token] = true;
            stablecoinList.push(token);
        }
    }

    /*//////////////////////////////////////////////////////////////
                                DEPOSIT
    //////////////////////////////////////////////////////////////*/

    /// @notice Deposit stablecoins into the lending pool
    /// @param token   The whitelisted stablecoin address
    /// @param amount  Number of tokens to deposit
    /// @dev Integrators SHOULD pass `feeCurrency` (e.g. cUSD) override per MiniPay Fee Abstraction :contentReference[oaicite:4]{index=4}
    function deposit(address token, uint256 amount) external {
        require(approvedStablecoins[token], "Stablecoin not allowed");
        require(amount > 0,                 "Amount must be > 0");

        // Transfer tokens in
        IERC20(token).transferFrom(msg.sender, address(this), amount);

        PoolState storage pool = pools[token];
        pool.totalDeposits += amount;
        pool.totalPool     += amount;
        pool.userDeposits[msg.sender] += amount;

        emit Deposit(msg.sender, token, amount);
    }

    /*//////////////////////////////////////////////////////////////
                                BORROW
    //////////////////////////////////////////////////////////////*/

    /// @notice Borrow up to available liquidity from the pool
    /// @param token   The whitelisted stablecoin address
    /// @param amount  Number of tokens to borrow
    /// @dev Integrators SHOULD pass `feeCurrency` override per Celo docs :contentReference[oaicite:5]{index=5}
    function borrow(address token, uint256 amount) external {
        require(approvedStablecoins[token], "Stablecoin not allowed");
        require(amount > 0,                 "Amount must be > 0");

        PoolState storage pool = pools[token];
        require(pool.totalPool >= amount,   "Insufficient liquidity");

        Loan storage loan = userLoans[msg.sender][token];
        require(!loan.active,               "Loan already active");

        // Initialize loan
        loan.principal       = amount;
        loan.interestAccrued = 0;
        loan.lastUpdate      = block.timestamp;
        loan.active          = true;

        pool.totalPool -= amount;
        IERC20(token).transfer(msg.sender, amount);

        emit LoanCreated(msg.sender, token, amount);
    }

    /*//////////////////////////////////////////////////////////////
                               REPAYMENT
    //////////////////////////////////////////////////////////////*/

    /// @notice Repay an active loan (interest + principal)
    /// @param token   The whitelisted stablecoin address
    /// @param amount  Amount to repay (≤ principal + accrued interest)
    /// @dev Applies accrued interest, then credit pool; pass `feeCurrency` override :contentReference[oaicite:6]{index=6}
    function repay(address token, uint256 amount) external {
        require(approvedStablecoins[token], "Stablecoin not allowed");
        require(amount > 0,                 "Amount must be > 0");

        Loan storage loan = userLoans[msg.sender][token];
        require(loan.active,                "No active loan");

        _accrueInterest(msg.sender, token);

        uint256 totalOwed = loan.principal + loan.interestAccrued;
        require(amount <= totalOwed,        "Repay too much");

        IERC20(token).transferFrom(msg.sender, address(this), amount);

        // Pay interest first
        if (amount >= loan.interestAccrued) {
            amount -= loan.interestAccrued;
            pools[token].totalPool += loan.interestAccrued;
            loan.interestAccrued = 0;

            loan.principal -= amount;
            pools[token].totalPool += amount;
        } else {
            loan.interestAccrued -= amount;
            pools[token].totalPool += amount;
        }

        // Deactivate if fully repaid
        if (loan.principal == 0 && loan.interestAccrued == 0) {
            loan.active = false;
        } else {
            loan.lastUpdate = block.timestamp;
        }

        emit LoanRepaid(msg.sender, token, amount);
    }

    /*//////////////////////////////////////////////////////////////
                              INTEREST LOGIC
    //////////////////////////////////////////////////////////////*/

    /// @notice Internal: Accrue simple interest on a user loan
    /// @param user    Borrower’s address
    /// @param token   The stablecoin address
    function _accrueInterest(address user, address token) internal {
        Loan storage loan = userLoans[user][token];
        if (!loan.active) return;

        uint256 diff = block.timestamp - loan.lastUpdate;
        if (diff == 0) return;

        uint256 interest = (loan.principal * annualRateBps * diff) / (BPS * 365 days);
        loan.interestAccrued += interest;
        loan.lastUpdate = block.timestamp;
    }

    /*//////////////////////////////////////////////////////////////
                                 YIELDS
    //////////////////////////////////////////////////////////////*/

    /// @notice View detailed yield, factoring in loan repayment if active
    /// @param token   The stablecoin address
    /// @param user    Depositor’s address
    /// @return Yields struct with grossYield, netYield, usedForLoanRepayment
    /// @dev Gas abstraction: view only, no state change :contentReference[oaicite:7]{index=7}
    function getYields(address token, address user) external view returns (Yields memory) {
        PoolState storage ps = pools[token];
        uint256 principal = ps.userDeposits[user];
        if (principal == 0) {
            return Yields(0, 0, 0);
        }

        uint256 share = (ps.totalPool * principal) / ps.totalDeposits;
        uint256 gross = share > principal ? share - principal : 0;

        Yields memory y;
        y.grossYield = gross;

        Loan storage loan = userLoans[user][token];
        if (loan.active && gross > 0) {
            uint256 extra = (loan.principal * annualRateBps * (block.timestamp - loan.lastUpdate))
                          / (BPS * 365 days);
            uint256 totalInt = loan.interestAccrued + extra;

            y.usedForLoanRepayment = gross > totalInt ? totalInt : gross;
            y.netYield            = gross - y.usedForLoanRepayment;
        } else {
            y.netYield            = gross;
            y.usedForLoanRepayment= 0;
        }

        return y;
    }

    /*//////////////////////////////////////////////////////////////
                              WITHDRAWAL
    //////////////////////////////////////////////////////////////*/

    /// @notice Withdraw principal + net yield (after auto‐repaying loan interest)
    /// @param token   The stablecoin address
    /// @dev Integrators SHOULD pass `feeCurrency` override to minimize CELO usage :contentReference[oaicite:8]{index=8}
    function withdraw(address token) external {
        PoolState storage pool = pools[token];
        uint256 principal = pool.userDeposits[msg.sender];
        require(principal > 0, "No deposit");

        uint256 share = (pool.totalPool * principal) / pool.totalDeposits;
        uint256 gain  = share > principal ? share - principal : 0;

        Loan storage loan = userLoans[msg.sender][token];
        if (loan.active && gain > 0) {
            _accrueInterest(msg.sender, token);
            uint256 repayAmt = gain > loan.interestAccrued ? loan.interestAccrued : gain;
            loan.interestAccrued -= repayAmt;
            pool.totalPool += repayAmt;
            gain  -= repayAmt;
            share -= repayAmt;
            if (loan.principal == 0 && loan.interestAccrued == 0) {
                loan.active = false;
            }
        }

        pool.totalDeposits -= principal;
        pool.totalPool     -= share;
        pool.userDeposits[msg.sender] = 0;
        pool.userWithdrawn[msg.sender] += share;

        IERC20(token).transfer(msg.sender, share);
        emit Withdraw(msg.sender, token, share);
    }

    /*//////////////////////////////////////////////////////////////
                         WITHDRAWABLE VIEW
    //////////////////////////////////////////////////////////////*/

    /// @notice Estimate current withdrawable amount and auto‐repay portion
    /// @param token   The stablecoin address
    /// @param user    Depositor’s address
    /// @return withdrawable Net amount redeemable
    /// @return usedForLoan Amount that would go to loan interest
    /// @dev Pure view, uses on‐chain timestamps :contentReference[oaicite:9]{index=9}
    function getWithdrawable(address token, address user)
        external
        view
        returns (uint256 withdrawable, uint256 usedForLoan)
    {
        PoolState storage pool = pools[token];
        uint256 principal = pool.userDeposits[user];
        if (principal == 0) {
            return (0, 0);
        }

        uint256 share = (pool.totalPool * principal) / pool.totalDeposits;
        uint256 gain  = share > principal ? share - principal : 0;

        Loan storage loan = userLoans[user][token];
        if (loan.active && gain > 0) {
            uint256 diff     = block.timestamp - loan.lastUpdate;
            uint256 interest = (loan.principal * annualRateBps * diff) / (BPS * 365 days);
            uint256 totalInt = loan.interestAccrued + interest;

            usedForLoan    = gain > totalInt ? totalInt : gain;
            withdrawable   = share - usedForLoan;
        } else {
            withdrawable   = share;
            usedForLoan    = 0;
        }
    }

    /*//////////////////////////////////////////////////////////////
                              ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Update the annual interest rate (in basis points)
    /// @param newRateBps New APR in BPS (max 20% = 2000)
    function setAnnualRate(uint256 newRateBps) external onlyOwner {
        require(newRateBps <= 2000, "Max 20%");
        annualRateBps = newRateBps;
    }
}

/// @notice Minimal ERC-20 interface
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}