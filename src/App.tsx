import { ConnectButton } from '@rainbow-me/rainbowkit'
import { getBridgeAddress } from './lib/contracts'
import { useAccount, useNetwork, useSwitchNetwork } from 'wagmi'
import { useState } from 'react'
import useDebounce from './hooks/useDebounce'
import { LoadingText } from './components/LoadingText'

export default function App() {
  const { chain } = useNetwork()
  const { isConnected } = useAccount()
  const bridgeAddress = getBridgeAddress(chain?.id)

  const [isTestnet, setIsTestnet] = useState(true)
  const [amountEth, setAmountEth] = useState<string>('0.1')
  const debouncedEth = useDebounce(amountEth, 500)
  const numberRegex = /^\d*\.?\d*$/

  const isEthValueValid = numberRegex.test(debouncedEth)

  const switchToGoerli = useSwitchNetwork({ chainId: 5 })
  const switchToHomestead = useSwitchNetwork({ chainId: 1 })
  const isCorrectChain = chain?.id === (isTestnet ? 5 : 1)

  return (
    <>
      {!isTestnet && <p>⚠︎ Mainnet is new. Continue at your own risk ⚠︎</p>}

      <main>
        <ConnectButton />

        <div className="network-toggle">
          <button
            onClick={() => {
              // switch to homestead if not already on homestead
              if (chain?.id !== 1) switchToHomestead.switchNetwork?.()
              setIsTestnet(false)
            }}
            className={isTestnet ? 'light' : ''}
          >
            Mainnet
          </button>
          <button
            onClick={() => {
              // switch to goerli if not already on goerli
              if (chain?.id !== 5) switchToGoerli.switchNetwork?.()
              setIsTestnet(true)
            }}
            className={isTestnet ? '' : 'light'}
          >
            Testnet
          </button>
        </div>

        {/* Switch network button */}
        {!isCorrectChain && isConnected && (
          <button
            onClick={() => {
              if (isTestnet) switchToGoerli.switchNetwork?.()
              if (!isTestnet) switchToHomestead.switchNetwork?.()
            }}
          >
            <LoadingText
              loading={switchToGoerli.isLoading || switchToHomestead.isLoading}
            >
              Switch network
            </LoadingText>
          </button>
        )}

        {/* Input for ETH amount */}
        <div className="input-wrapper">
          <label htmlFor="ethAmount">ETH</label>
          <input
            id="ethAmount"
            type="text"
            placeholder="0.01"
            onChange={(e) => setAmountEth(e.target.value)}
          />
        </div>

        {!isEthValueValid && <p>Invalid ETH amount</p>}
      </main>
    </>
  )
}
