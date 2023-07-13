import { ConnectButton } from '@rainbow-me/rainbowkit'
import { getBridgeAddress } from './lib/contracts'
import { useNetwork, useSwitchNetwork } from 'wagmi'
import { useState } from 'react'
import useDebounce from './hooks/useDebounce'
import { LoadingText } from './components/LoadingText'

export default function App() {
  const { chain } = useNetwork()
  const bridgeAddress = getBridgeAddress(chain?.id)

  const [isTestnet, setIsTestnet] = useState(true)
  const [amountEth, setAmountEth] = useState<string>('')
  const debouncedEth = useDebounce(amountEth, 500)
  const numberRegex = /^\d*\.?\d*$/

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
              // switch to goerli if not already on goerli
              if (chain?.id !== 5) switchToGoerli.switchNetwork?.()
              setIsTestnet(true)
            }}
            className={isTestnet ? '' : 'light'}
          >
            Testnet
          </button>
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
        </div>

        {/* Switch network button */}
        {!isCorrectChain && (
          <button
            onClick={() => {
              if (isTestnet) return switchToGoerli.switchNetwork?.()
              if (!isTestnet) return switchToHomestead.switchNetwork?.()
            }}
          >
            <LoadingText
              loading={switchToGoerli.isLoading || switchToHomestead.isLoading}
            >
              Switch network
            </LoadingText>
          </button>
        )}
      </main>
    </>
  )
}
