import os
from hdwallet import HDWallet
from hdwallet.symbols import BTC, ETH


class MultiAssetHDWallet:
    def __init__(self):
        mnemonic_phrase = os.getenv("MASTER_SEED")
        if not mnemonic_phrase:
            raise EnvironmentError("MASTER_SEED environment variable is missing!")

        self.mnemonic = mnemonic_phrase.strip()

    def _create_wallet(self, symbol):
        """Create wallet using symbol (most compatible way)"""
        wallet = HDWallet(symbol=symbol, use_default_path=False)
        wallet.from_mnemonic(mnemonic=self.mnemonic)
        return wallet

    def get_btc_account(self, index: int = 0, bip: int = 84) -> dict:
        wallet = self._create_wallet(BTC)
        wallet.clean_derivation()

        if bip == 49:
            wallet.from_index(49, hardened=True)
            wallet.from_index(0, hardened=True)
            wallet.from_index(0, hardened=True)
            wallet.from_index(0)
            wallet.from_index(index)
            address = wallet.p2sh_address()
            semantic = "BIP49 (Nested SegWit)"

        elif bip == 84:
            wallet.from_index(84, hardened=True)
            wallet.from_index(0, hardened=True)
            wallet.from_index(0, hardened=True)
            wallet.from_index(0)
            wallet.from_index(index)
            address = wallet.p2wpkh_address()
            semantic = "BIP84 (Native SegWit)"

        else:
            wallet.from_index(44, hardened=True)
            wallet.from_index(0, hardened=True)
            wallet.from_index(0, hardened=True)
            wallet.from_index(0)
            wallet.from_index(index)
            address = wallet.p2pkh_address()
            semantic = "BIP44 (Legacy)"

        return {
            "asset": "BTC",
            "derivation": semantic,
            "address": address,
            "private_key": wallet.private_key(),
            "path": wallet.path()
        }

    def get_eth_account(self, index: int = 0) -> dict:
        wallet = self._create_wallet(ETH)
        wallet.clean_derivation()

        wallet.from_index(44, hardened=True)
        wallet.from_index(60, hardened=True)
        wallet.from_index(0, hardened=True)
        wallet.from_index(0)
        wallet.from_index(index)

        return {
            "asset": "ETH & USDT (ERC-20)",
            "address": wallet.address(),
            "private_key": wallet.private_key(),
            "path": wallet.import os
        from hdwallet import HDWallet
        from hdwallet.symbols import BTC, ETH


        class MultiAssetHDWallet:
            def __init__(self):
                mnemonic_phrase = os.getenv("MASTER_SEED")
                if not mnemonic_phrase:
                    raise EnvironmentError("MASTER_SEED environment variable is missing!")

                self.mnemonic = mnemonic_phrase.strip()

            def ping(self) -> dict:
                """Health check - Test if wallet is working correctly"""
                try:
                    # Test BTC (BIP84)
                    wallet_btc = HDWallet(symbol=BTC, use_default_path=False)
                    wallet_btc.from_mnemonic(mnemonic=self.mnemonic)
                    wallet_btc.clean_derivation()
                    wallet_btc.from_index(84, hardened=True)
                    wallet_btc.from_index(0, hardened=True)
                    wallet_btc.from_index(0, hardened=True)
                    wallet_btc.from_index(0)
                    wallet_btc.from_index(0)

                    # Test ETH
                    wallet_eth = HDWallet(symbol=ETH, use_default_path=False)
                    wallet_eth.from_mnemonic(mnemonic=self.mnemonic)
                    wallet_eth.clean_derivation()
                    wallet_eth.from_index(44, hardened=True)
                    wallet_eth.from_index(60, hardened=True)
                    wallet_eth.from_index(0, hardened=True)
                    wallet_eth.from_index(0)
                    wallet_eth.from_index(0)

                    return {
                        "status": "OK",
                        "message": "Wallet is working correctly",
                        "btc_test_address": wallet_btc.p2wpkh_address()[:20] + "...",
                        "eth_test_address": wallet_eth.address()[:20] + "...",
                        "mnemonic_words": len(self.mnemonic.split())
                    }
                except Exception as e:
                    return {
                        "status": "ERROR",
                        "message": str(e)
                    }

            def _create_wallet(self, symbol):
                wallet = HDWallet(symbol=symbol, use_default_path=False)
                wallet.from_mnemonic(mnemonic=self.mnemonic)
                return wallet

            def get_btc_account(self, index: int = 0, bip: int = 84) -> dict:
                wallet = self._create_wallet(BTC)
                wallet.clean_derivation()

                if bip == 49:
                    wallet.from_index(49, hardened=True)
                    wallet.from_index(0, hardened=True)
                    wallet.from_index(0, hardened=True)
                    wallet.from_index(0)
                    wallet.from_index(index)
                    address = wallet.p2sh_address()
                    semantic = "BIP49 (Nested SegWit)"

                elif bip == 84:
                    wallet.from_index(84, hardened=True)
                    wallet.from_index(0, hardened=True)
                    wallet.from_index(0, hardened=True)
                    wallet.from_index(0)
                    wallet.from_index(index)
                    address = wallet.p2wpkh_address()
                    semantic = "BIP84 (Native SegWit)"

                else:
                    wallet.from_index(44, hardened=True)
                    wallet.from_index(0, hardened=True)
                    wallet.from_index(0, hardened=True)
                    wallet.from_index(0)
                    wallet.from_index(index)
                    address = wallet.p2pkh_address()
                    semantic = "BIP44 (Legacy)"

                return {
                    "asset": "BTC",
                    "derivation": semantic,
                    "address": address,
                    "private_key": wallet.private_key(),
                    "path": wallet.path()
                }

            def get_eth_account(self, index: int = 0) -> dict:
                wallet = self._create_wallet(ETH)
                wallet.clean_derivation()

                wallet.from_index(44, hardened=True)
                wallet.from_index(60, hardened=True)
                wallet.from_index(0, hardened=True)
                wallet.from_index(0)
                wallet.from_index(index)

                return {
                    "asset": "ETH & USDT (ERC-20)",
                    "address": wallet.address(),
                    "private_key": wallet.private_key(),
                    "path": wallet.path()
                }