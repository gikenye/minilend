import { Core } from '@walletconnect/core'
import { Web3Wallet } from '@walletconnect/web3wallet'
import type { IWeb3Wallet } from '@walletconnect/web3wallet'

let web3Wallet: IWeb3Wallet | null = null

export const initializeWalletConnect = async () => {
  if (!web3Wallet) {
    const core = new Core({
      projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID,
    })

    web3Wallet = await Web3Wallet.init({
      core,
      metadata: {
        name: 'MiniLend',
        description: 'Decentralized lending platform',
        url: 'https://minilend.xyz',
        icons: ['https://minilend.xyz/logo.png'],
      },
    })
  }
  return web3Wallet
}

export const getWalletConnectInstance = () => {
  if (!web3Wallet) {
    throw new Error('WalletConnect not initialized')
  }
  return web3Wallet
}