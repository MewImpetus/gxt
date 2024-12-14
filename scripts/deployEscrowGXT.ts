import { toNano, Address } from '@ton/core';
import { EscrowGXT } from '../wrappers/EscrowGXT';
import { NetworkProvider } from '@ton/blueprint';
import { JettonMaster } from '@ton/ton';

export async function run(provider: NetworkProvider) {

    const admin = Address.parse("0QAVWJbfEIGvKOht-utclCtzpnitbaWm70HwRa24NoTpUCTI")
    const user = Address.parse("0QAS8_N1tq8uFf1kzTTFjlVZN6foFzCPkVUSniWx6bHqxe8u")
    const JettonMasterAddress = Address.parse("kQBlEmR6RCwLNu5Lfpq8hh91DCMsGq3aO5kucNQHTAM3gyWb")

    const escrowGXT = provider.open(await EscrowGXT.fromInit(admin, JettonMasterAddress));

    // await escrowGXT.send(
    //     provider.sender(),
    //     {
    //         value: toNano('0.05'),
    //     },
    //     {
    //         $$type: 'Deploy',
    //         queryId: 0n,
    //     }
    // );

    // await provider.waitForDeploy(escrowGXT.address);

    // address: EQCXNbSb-x6lbWLlQdwF1TKmviEJ77jOMQfLsj1vqXbaL7lK

    // run methods on `escrowGXT`

    // 分配token

    // //1. Private Investors
    // await escrowGXT.send(
    //     provider.sender(),
    //     {
    //         value: toNano("0.02"),
    //         bounce: false,
    //     },
    //     {
    //         $$type: "AddDistribution",
    //         name: "Private Investors",
    //         allocation: toNano("21000000000"),
    //         cliff_duration: BigInt(3600*24*30*6),
    //         vesting_duration: BigInt(3600*24*30*18),
    //         admin: admin,   
    //     }
    // );


    // //2. Community
    // await escrowGXT.send(
    //     provider.sender(),
    //     {
    //         value: toNano("0.005"),
    //         bounce: false,
    //     },
    //     {
    //         $$type: "AddDistribution",
    //         name: "Community",
    //         allocation: toNano("2100000000"),
    //         cliff_duration: BigInt(3600*24*30*2),
    //         vesting_duration: BigInt(3600*24*30*10),
    //         admin: admin,   
    //     }
    // );


    // //3. Foundation Treasury
    // await escrowGXT.send(
    //     provider.sender(),
    //     {
    //         value: toNano("0.005"),
    //         bounce: false,
    //     },
    //     {
    //         $$type: "AddDistribution",
    //         name: "Foundation Treasury",
    //         allocation: toNano("8400000000"),
    //         cliff_duration: BigInt(3600*24*30*0),
    //         vesting_duration: BigInt(3600*24*30*36),
    //         admin: admin,   
    //     }
    // );


    // //4. Team & Advisors
    // await escrowGXT.send(
    //     provider.sender(),
    //     {
    //         value: toNano("0.005"),
    //         bounce: false,
    //     },
    //     {
    //         $$type: "AddDistribution",
    //         name: "Team & Advisors",
    //         allocation: toNano("2100000000"),
    //         cliff_duration: BigInt(3600*24*30*12),
    //         vesting_duration: BigInt(3600*24*30*12),
    //         admin: admin,   
    //     }
    // );

    // //5. Operations Marketing
    // await escrowGXT.send(
    //     provider.sender(),
    //     {
    //         value: toNano("0.005"),
    //         bounce: false,
    //     },
    //     {
    //         $$type: "AddDistribution",
    //         name: "Operations Marketing",
    //         allocation: toNano("2100000000"),
    //         cliff_duration: BigInt(3600*24*30*0),
    //         vesting_duration: BigInt(3600*24*30*36),
    //         admin: admin,   
    //     }
    // );

    // //6. Launch Partners
    // await escrowGXT.send(
    //     provider.sender(),
    //     {
    //         value: toNano("0.005"),
    //         bounce: false,
    //     },
    //     {
    //         $$type: "AddDistribution",
    //         name: "Launch Partners",
    //         allocation: toNano("21000000000"),
    //         cliff_duration: BigInt(3600*24*30*6),
    //         vesting_duration: BigInt(3600*24*30*18),
    //         admin: admin,   
    //     }
    // );


    // //7. Airdrop
    // await escrowGXT.send(
    //     provider.sender(),
    //     {
    //         value: toNano("0.005"),
    //         bounce: false,
    //     },
    //     {
    //         $$type: "AddDistribution",
    //         name: "Airdrop",
    //         allocation: toNano("420000000"),
    //         cliff_duration: BigInt(3600*24*30*0),
    //         vesting_duration: BigInt(3600*24*30*24),
    //         admin: admin,   
    //     }
    // );


    // //8. Airdrop
    // await escrowGXT.send(
    //     provider.sender(),
    //     {
    //         value: toNano("0.005"),
    //         bounce: false,
    //     },
    //     {
    //         $$type: "AddDistribution",
    //         name: "Ecosystem Liquidity",
    //         allocation: toNano("31500000000"),
    //         cliff_duration: BigInt(3600*24*30*0),
    //         vesting_duration: BigInt(3600*24*30*48),
    //         admin: admin,   
    //     }
    // );

    //9. others
    // await escrowGXT.send(
    //     provider.sender(),
    //     {
    //         value: toNano("0.005"),
    //         bounce: false,
    //     },
    //     {
    //         $$type: "AddDistribution",
    //         name: "others",
    //         allocation: toNano("94500000000"),
    //         cliff_duration: BigInt(3600*24*30*30),
    //         vesting_duration: BigInt(1),
    //         admin: admin,   
    //     }
    // );


    // await escrowGXT.send(
    //     provider.sender(),
    //     {
    //         value: toNano("0.05"),
    //         bounce: false,
    //     },
    //     {
    //         $$type: "ExtractingToken",
    //         queryId: 0n,
    //         name: "Foundation Treasury",
    //         amount: toNano("10"),
    //         to: user
    //     }
    // )

    // await escrowGXT.send(
    //         provider.sender(),
    //         {
    //             value: toNano("0.5"),
    //             bounce: false,
    //         },
    //         "activate"
    //     )


    // await escrowGXT.send(
    //     provider.sender(),
    //     {
    //         value: toNano("0.2"),
    //         bounce: false,
    //     },
    //     {
    //         $$type: "ExtractingAnything",
    //         queryId: 0n,
    //         amount: toNano("10000"),
    //         to: user
    //     }
    // )


    
}
