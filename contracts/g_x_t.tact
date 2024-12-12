import "@stdlib/deploy";
import "./jetton/jetton.tact";


message MintAll {
    targetAddress: Address;
}

contract JettonMasterGXT with JettonMaster {
    owner: Address;
    staticTax: Int as coins = ton("0.001");
    lockedValue: Int as coins = 0;
    content: Cell;
    totalSupply: Int as coins;
    maxSupply: Int as coins;  // 发行上限
    mintable: Bool;

    init(owner: Address, content: Tep64TokenData, maxSupply: Int) {
        self.owner = owner;

        self.content = content.toCell();
        self.totalSupply = 0;
        self.maxSupply = maxSupply; // 设置发行上限
        self.mintable = true;
    }

    // mint_all 功能：一次性铸造剩余代币到指定地址，并将 mintable 设置为 false
    receive(msg: MintAll) {

        self.receiveMintJetton(MintJetton{
            queryId: 0,
            amount: self.maxSupply - self.totalSupply,
            receiver: msg.targetAddress,
            forwardAmount: 0, 
            responseDestination: msg.targetAddress,
            forwardPayload: null
        });

        // 设置 mintable 为 false，禁止进一步铸造
        self.mintable = false;
    }
}