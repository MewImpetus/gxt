import "@stdlib/deploy";
import "./g_x_t.tact";


struct VestingSchedule  {
    name: String;
    allocation: Int as coins; // 总量
    cliff_duration: Int; //锁仓期
    vesting_duration: Int; //释放期
    release_speed: Int; //释放速度
    extracted: Int; // 已提取
    admin: Address; // 管理员地址   
}

message AddDistribution {
    name: String;
    allocation: Int as coins; // 总量
    cliff_duration: Int; //锁仓期
    vesting_duration: Int; //释放期
    admin: Address; // 管理员地址   
}

message DeleteDistribution {
    name: String;
}

message ExtractingToken {
    queryId: Int;
    name: String;
    amount: Int as coins;
    to: Address;
}

message ExtractingAnything {
    queryId: Int;
    amount: Int as coins;
    to: Address;
}

message ReleaseEvent {
    distribution: String;
    amount: Int as coins;
    recipient: Address;
}

message UpdateAdmin {
    name: String;
    new_admin: Address;
}


contract EscrowGXT with Deployable {
    const MinTonForStorage: Int = ton("0.01"); 
    owner: Address;
    master: Address;
    lock_start: Int;

    distribution: map<Int, VestingSchedule>;

    init(owner: Address, master: Address) {
        self.owner = owner;
        self.master = master;
        self.lock_start = now();
    }

    receive("activate") {
        dump("empty message received");
    }


    receive(msg: AddDistribution) {
        let ctx: Context = context();
        require(ctx.sender == self.owner, "Not Owner");
        if (self.distribution.get(sha256(msg.name)) == null) {
            self.distribution.set(sha256(msg.name), VestingSchedule {
            name: msg.name,
            allocation: msg.allocation,
            cliff_duration: msg.cliff_duration,
            vesting_duration: msg.vesting_duration,
            release_speed: msg.allocation / msg.vesting_duration,
            extracted: 0,
            admin: msg.admin
            });
        }  
    }

    receive(msg: DeleteDistribution) {
        let ctx: Context = context();
        require(ctx.sender == self.owner, "Not Owner");
        self.distribution.set(sha256(msg.name), null);
    }


    receive(msg: ExtractingToken) {
        let ctx: Context = context();
        let key = sha256(msg.name);
        require(self.distribution.get(key) != null, "Allocation name does not exist");

        let distribution = self.distribution.get(key)!!;
        let currentTime: Int = now();
        let delta: Int = now() - self.lock_start;
        require(delta > distribution.cliff_duration, "The allocation has not been unlocked");
        require(ctx.sender == self.owner || ctx.sender == distribution.admin, "Not Owner");

        let can_extract_tokens: Int = distribution.release_speed * (delta - distribution.cliff_duration) - distribution.extracted;

        require(can_extract_tokens > 0 && msg.amount <= can_extract_tokens, "Insufficient balance available for withdrawal");

        distribution.extracted = distribution.extracted + msg.amount;
        self.distribution.set(key, distribution);

        send(SendParameters{
                to: self.getWalletAddress(),
                value: myBalance() - ctx.value - self.MinTonForStorage,
                bounce: true,
                mode: SendRemainingValue,
                body: TokenTransfer{
                    queryId: msg.queryId,
                    amount: msg.amount,
                    destination: msg.to,
                    responseDestination: sender(),
                    forwardAmount: 0
                }.toCell()
        });

        

        emit(ReleaseEvent{distribution: msg.name, amount: msg.amount, recipient: msg.to}.toCell());

    }

    receive(msg: ExtractingAnything) {
        let ctx: Context = context();
        send(SendParameters{
                to: self.getWalletAddress(),
                value: myBalance() - ctx.value - self.MinTonForStorage,
                bounce: true,
                mode: SendRemainingValue,
                body: TokenTransfer{
                    queryId: msg.queryId,
                    amount: msg.amount,
                    destination: msg.to,
                    responseDestination: sender(),
                    forwardAmount: 0
                }.toCell()
        });
    }

    receive(msg: UpdateAdmin) {
        let ctx: Context = context();
        require(ctx.sender == self.owner, "Not Owner");
        let key = sha256(msg.name);
        require(self.distribution.get(key) != null, "Distribution does not exist");

        let distribution = self.distribution.get(key)!!;
        distribution.admin = msg.new_admin;
        self.distribution.set(key, distribution);
    }

    
    fun getWalletAddress(): Address {
        return contractAddress(initOf JettonWalletTemplate(self.master, myAddress()));
    }

    get fun wallet_address(): Address {
        return self.getWalletAddress();
    }

    get fun get_distribution_of_name(name: String): VestingSchedule? {
        return self.distribution.get(sha256(name));
    }
}
