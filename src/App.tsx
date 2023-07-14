import { ConnectButton, useConnectModal } from '@rainbow-me/rainbowkit'
import { getBridgeAddress } from './lib/contracts'
import {
  useAccount,
  useDisconnect,
  useNetwork,
  usePrepareSendTransaction,
  useSendTransaction,
  useSwitchNetwork,
  useWaitForTransaction,
} from 'wagmi'
import { useState } from 'react'
import useDebounce from './hooks/useDebounce'
import { LoadingText } from './components/LoadingText'
import { parseEther } from 'viem/utils'
import { buildBaseExplorerLink, buildEtherscanLink } from './lib/utilts'

export default function App() {
  const { chain } = useNetwork()
  const { address } = useAccount()
  const { openConnectModal } = useConnectModal()
  const { disconnect } = useDisconnect()

  const [isTestnet, setIsTestnet] = useState(false)
  const [amountEth, setAmountEth] = useState<string>('0.1')
  const debouncedEth = useDebounce(amountEth, 500)
  const numberRegex = /^\d*\.?\d*$/
  const isEthValueValid =
    numberRegex.test(debouncedEth) && Number(debouncedEth) > 0

  const switchToGoerli = useSwitchNetwork({ chainId: 5 })
  const switchToHomestead = useSwitchNetwork({ chainId: 1 })
  const isCorrectChain = chain?.id === (isTestnet ? 5 : 1)

  const prepare = usePrepareSendTransaction({
    chainId: isTestnet ? 5 : 1,
    to: getBridgeAddress(isTestnet ? 5 : 1),
    value: isEthValueValid
      ? parseEther(`${Number(debouncedEth)}`, 'wei')
      : undefined,
    gas: BigInt(130_000),
    enabled: isEthValueValid,
  })

  const transaction = useSendTransaction(prepare.config)
  const receipt = useWaitForTransaction({ hash: transaction.data?.hash })

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

        <div className="input-group">
          {!address ? (
            <button className="button" onClick={() => openConnectModal?.()}>
              Connect
            </button>
          ) : receipt.isError ? (
            <>
              <a
                className="button"
                target="_blank"
                href={buildEtherscanLink(
                  chain?.id,
                  transaction.data?.hash || ''
                )}
              >
                Transaction failed :/
              </a>
              <button onClick={() => window.location.reload()}>
                Refresh and try again
              </button>
            </>
          ) : receipt.isSuccess ? (
            <a
              className="button"
              target="_blank"
              href={buildBaseExplorerLink(chain?.id, address)}
            >
              View on Base Explorer
            </a>
          ) : transaction.data?.hash ? (
            <>
              <div className="button">
                <LoadingText>Bridging</LoadingText>
              </div>
              <span>
                <a
                  target="_blank"
                  href={buildEtherscanLink(chain?.id, transaction.data?.hash)}
                >
                  View on Etherscan
                </a>
              </span>
            </>
          ) : (
            <>
              {chain?.id === 5 || chain?.id === 1 ? (
                <>
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

                  <button
                    className="button"
                    disabled={
                      !transaction.sendTransaction ||
                      amountEth !== debouncedEth ||
                      !isEthValueValid
                    }
                    onClick={() => transaction.sendTransaction?.()}
                  >
                    {transaction.isLoading ? (
                      <LoadingText>Confirm in wallet</LoadingText>
                    ) : prepare.error?.name === 'EstimateGasExecutionError' ? (
                      'Insufficient funds'
                    ) : !isCorrectChain ? (
                      'Wrong network'
                    ) : (
                      'Bridge'
                    )}
                  </button>
                </>
              ) : (
                <button
                  className="button"
                  onClick={() => switchToHomestead.switchNetwork?.()}
                >
                  Switch network
                </button>
              )}

              {/* Switch network button */}
              {!isCorrectChain ? (
                <button
                  onClick={() => {
                    if (isTestnet) switchToGoerli.switchNetwork?.()
                    if (!isTestnet) switchToHomestead.switchNetwork?.()
                  }}
                >
                  <LoadingText
                    loading={
                      switchToGoerli.isLoading || switchToHomestead.isLoading
                    }
                  >
                    Switch network
                  </LoadingText>
                </button>
              ) : (
                <button onClick={() => disconnect?.()}>Disconnect</button>
              )}
            </>
          )}
        </div>
      </main>
    </>
  )
}
