import { ethers } from "hardhat";

async function main() {
  const annualRate = 500; // Set your desired annual rate (500 = 5% in basis points)

  const MiniLend = await ethers.getContractFactory("MiniLend");
  const miniLend = await MiniLend.deploy(annualRate); // Add parameter here

  await miniLend.waitForDeployment();
  console.log("MiniLend deployed to:", await miniLend.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
