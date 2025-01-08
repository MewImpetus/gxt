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

struct VestingScheduleWithReleased {
    name: String;
    allocation: Int as coins; // 总量
    cliff_duration: Int; //锁仓期
    vesting_duration: Int; //释放期
    release_speed: Int; //释放速度
    extracted: Int; // 已提取
    admin: Address; // 管理员地址 
    released: Int; // 当前已释放
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


message UpdateOwner {
    owner: Address;
}


contract EscrowGXT with Deployable {
    const MinTonForStorage: Int = ton("0.02"); 
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
        require(msg.vesting_duration > 0, "Vesting duration must be greater than zero");
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
        let delta: Int = now() - self.lock_start;
        require(delta > distribution.cliff_duration, "The allocation has not been unlocked");
        require(ctx.sender == self.owner || ctx.sender == distribution.admin, "Not Owner or Admin");

        let can_extract_tokens: Int = distribution.release_speed * (delta - distribution.cliff_duration) - distribution.extracted;

        require(can_extract_tokens > 0 && msg.amount <= can_extract_tokens, "Insufficient balance available for withdrawal");

        distribution.extracted = distribution.extracted + msg.amount;
        self.distribution.set(key, distribution);

        send(SendParameters{
                to: self.getWalletAddress(),
                value: ctx.value - self.MinTonForStorage,
                bounce: true,
                mode: SendRemainingValue,
                body: TokenTransfer{
                    queryId: msg.queryId,
                    amount: msg.amount,
                    destination: msg.to,
                    responseDestination: ctx.sender,
                    forwardAmount: 0
                }.toCell()
        });

        

        emit(ReleaseEvent{distribution: msg.name, amount: msg.amount, recipient: msg.to}.toCell());

    }

    // just for testing
    // receive(msg: ExtractingAnything) {
    //     let ctx: Context = context();
    //     require(ctx.sender == self.owner, "Not Owner");
    //     send(SendParameters{
    //             to: self.getWalletAddress(),
    //             value: ctx.value - self.MinTonForStorage,
    //             bounce: true,
    //             mode: SendRemainingValue,
    //             body: TokenTransfer{
    //                 queryId: msg.queryId,
    //                 amount: msg.amount,
    //                 destination: msg.to,
    //                 responseDestination: sender(),
    //                 forwardAmount: 0
    //             }.toCell()
    //     });
    // }

    receive("withdraw safe") {
        require(sender() == self.owner, "Only owner is allowed to withdraw");
        send(SendParameters{
            to: sender(),
            bounce: true,
            value: myBalance() - context().value - self.MinTonForStorage,
            mode: SendRemainingValue + SendIgnoreErrors
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

     receive(msg: UpdateOwner) {
        let ctx: Context = context();
        require(ctx.sender == self.owner, "Not Owner");
        self.owner = msg.owner;
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

    get fun get_distribution_released_of_name(name: String): VestingScheduleWithReleased? {
        if(self.distribution.get(sha256(name)) != null) {
            let distribution = self.distribution.get(sha256(name))!!;
            let elapsed = now() - self.lock_start - distribution.cliff_duration;
            if(elapsed < 0) {
                elapsed = 0
            }
            let released = elapsed * distribution.release_speed;
            if(released > distribution.allocation){
                released = distribution.allocation;
            }
            return VestingScheduleWithReleased {
                name: distribution.name,
                allocation: distribution.allocation,
                cliff_duration: distribution.cliff_duration,
                vesting_duration: distribution.vesting_duration,
                release_speed: distribution.release_speed,
                extracted: distribution.extracted,
                admin: distribution.admin,
                released: released
            }
        }
        return null;
    }
}
