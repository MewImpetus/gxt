import { CompilerConfig } from '@ton/blueprint';

export const compile: CompilerConfig = {
    lang: 'tact',
    target: 'contracts/escrow_g_x_t.tact',
    options: {
        debug: true,
    },
};
