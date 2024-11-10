import { Disclosure } from "@headlessui/react";
import { SimpleCard } from "../components/common/SimpleCard";
import { ChevronUpIcon } from "@heroicons/react/20/solid";

const lbcFaqDataEnglish = [
  {
    question: "How does the LBC work?",
    answer:
      "The LBC's primary function is to determine a token's fair market value. The token price starts at a relatively low rate to incentivize early buyers. With each token purchase, the price increases. However, if time passes without any purchases, the price decreases, a process that accelerates as the end of the sale approaches. If you wait, the price might drop, but there's also the chance it will rise if other users buy before you.",
  },
  {
    question: "What does the solid line represent?",
    answer:
      "The solid line illustrates the token price over time. It also plots all purchases made on the LBC so far. You can hover over the line to view details such as the price per token, the number of tokens bought, and the time of the purchase.",
  },
  {
    question: "What does the dotted line represent?",
    answer:
      "In the absence of any purchases, the dotted line offers a projection of the token's price trend over time.",
  },
  {
    question: "Does buying in larger or smaller quantities affect the price?",
    answer:
      "No, whether you buy 10 tokens twice or 20 tokens once, you'll encounter the same price. However, for very large sales, the price estimation we provide may be less accurate, and you may need to adjust for slippage.",
  },
  {
    question: "What does the price estimate indicate?",
    answer:
      "For instance, if you spend 1000 USDC, the 'Est. Receive' displays the expected number of tokens this amount will yield. This figure is a minimum estimation; the actual number could be higher but never lower. The 'Est. Price' represents the average cost per token if you receive the estimated minimum.",
  },
  {
    question: "Why does the estimated price differ from the current price?",
    answer:
      "The current price is the cost for the very next token purchased. If you're buying 100 tokens, for example, the first one will transact at this price. But subsequent tokens will each cost slightly more because the price increases with every token sold. Thus, for large purchases, the 'Est. Price' may be significantly higher than the current price.",
  },
  {
    question: "What is slippage?",
    answer:
      "Slippage refers to the difference between the expected price of a trade and the price at which the trade is executed. The estimated tokens you will receive is the minimum we guarantee. If the LBC can't provide this number at your price point, the transaction will fail. Slippage is deducted from our internal estimation to generate this value. If a large purchase transaction fails, you may need to increase the slippage.",
  },
  {
    question:
      "What happens when the sale ends, or when all the tokens are sold out?",
    answer:
      "Once the LBC runs out of tokens, the sale ends. If the sale period ends but some tokens remain unsold, they are returned to the LBC administrator.",
  },
  {
    question:
      "How can I ensure the token owner won't mint more tokens in the future?",
    answer:
      "Most token launches burn their mint authority after creating their initial supply. However, it's crucial to do your due diligence and fully understand the tokenomics of the token you're buying.",
  },
  {
    question: "Can I trade tokens back to the LBC after I've purchased them?",
    answer:
      "No, purchases are final. The LBC's goal is to assist projects in raising initial liquidity.",
  },
  {
    question: "What can I do with my tokens after purchase?",
    answer:
      "Apart from holding on to your tokens, you can explore other products we offer, such as CLP vaults!",
  },
];

const clpFaqDataEnglish = [
  {
    question: "What is a Concentrated Liquidity Provider (CLP)?",
    answer:
      "A traditional Liquidity Provider allocates liquidity uniformly on the price curve between 0 and infinity. A CLP provides liquidity in a specific price range, which vastly increases capital efficiency.",
  },
  {
    question: "What are the risks with CLPs?",
    answer:
      "If the price exits the range of the CLP, the Provider no longer earns any fees. To move a position to another price range, CLPs generally need to realize impermanent loss. For example, a SOL/USDC CLP sets a single range of $15-$20 per SOL. The price moves to $21. The CLP's entire position is now in USDC, and it is no longer earning fees. To start a new position the CLP can close the current position, convert some of that USDC to SOL, and start a new position.",
  },
  {
    question: "Is a CLP better than just holding the tokens?",
    answer:
      "It depends. CLPs earn fees, but may suffer impermanent loss. A CLP will usually beat holding a token when the price is relatively stable, or when it goes up and down a lot, but returns to roughly the same range. Holding will typically perform better if the asset rapidly gains value.",
  },
  {
    question:
      "How is a Concentrated Liquidity Market Maker (CLMM) different from a CLP?",
    answer:
      "In DeFi, these terms are usually interchangable. A CLMM sometimes refers to a CLP that is actively managing their position.",
  },
  {
    question: "What is a CLP Vault?",
    answer:
      "A CLP Vault is an actively-managed CLP. Users deposit funds in exchange for a stake in the vault. The vault's administrator uses those assets to open CLP positions, and manages the ranges of those positions to optimize profit. All staked users share proportionally in the performance of the vault.",
  },
  {
    question: "How is this CLP Vault managed?",
    answer:
      "Currently, the complexity of managing CLP positions is too difficult to automate. A team of skilled market makers actively manages vault positions, widening ranges when impending news might trigger volatility, and contracting them to optimize capital efficiency. The market adminstrator is never able to withdraw funds, they are only able to allocate ranges in the CLP vault's positions.",
  },
  {
    question: "What are the risks with a CLP Vault?",
    answer:
      "The vault's market maker may fail to generate optimal profit, there is no guarantee of performance. As always, do your due diligence.",
  },
  {
    question: "What makes this CLP vault better than others?",
    answer:
      "Our CLP vault supports multiple positions, a first-in-class feature on Solana. Other vaults are limited to a single range, and must deploy their liquidity evenly along that range. When they run into impermenant loss, the damage can be significant. Our vaults enable market adminstrators to allocate funds accross multiple ranges, allowing for advanced strategies like curves and bid-ask, which can improve yields and help mitigate impermanent losses.",
  },
  {
    question: "Why do I need to deposit both tokens?",
    answer:
      "When you make a deposit, the vault uses your assets to contribue to its current CLP positions, you need to supply the same ratio of assets the vault is currently using.",
  },
  {
    question:
      "When I withdraw, why do I get a different ratio of tokens than when I deposited?",
    answer:
      "Let's say you open a vault position with 50 token A and 50 token B, and both tokens are $1. Even if these tokens don't change price, you may get 75 A and 25 B when withdrawing from the vault: it all depends on which ranges the market adminstrator has decided to use at that time. The market adminstrator might rebalance liquidity to a 75/25 position, a 25/75 position, or any combination.",
  },
  {
    question: "Where is liquidity going?",
    answer:
      "Our vaults currently use Orca Whirlpools to provide concentrated liquidity.",
  },
];

//   const lbcDevInstructionsEnglish_0: string = "";
const lbcDevInstructionsEnglishTop =
  "Interested in launching your own curve? Just follow these handy directions. Note that you will have to support your own front end, but you can use our admin panel to send test transactions to your own curve.";
const lbcInstructionSteps: string[] = [
  "To get started, click the invisible button to the right of the Logo three times. This unlocks the Admin Panel, Curve Sim, and Faucet tabs in the navbar.",
  "1) Navigate to the Curve Sim. Play with the variables to plot out the LBC curve you want. Note that you can scale the Y-axis later, for example you can scale a price of $15 to $0.15, so just worry about the shape you want for now. C controls growth rate, D controls decay rate, k0/k1 control the decay over the given interval, and k0>k1",
  "2) Navigate to Admin Page. If you don't want to scale your curve, and don't care about yielding mint authority to the LBC until the sale is over, skip to step 5.",
  "3) Want to scale the curve? We'll create a Base -> Base Voucher Exchange. Click on Show/Hide Token Exchange Setup. Here you can create mints, or parse mints you are already authority over. Create a new mint for target, and use the mint you'll take as payment as the base. Set the exchange rate to your desired amount, then init the exchange. We'll use this key later.",
  "3.5) If you created a Base -> Base Voucher Exchange, and checked the seized mint option, you can continue. Otherwise, fund your exchange with vouchers.",
  "4) Want to retain control of your mint during the sale, or scale the amount received? We'll create a Target Voucher -> Target Exchange. Create an Exchange with a new mint as the base, and your target token mint as the target.",
  "4.5) Fund your exchange with your Token. Make sure to supply at least enough for bonding to sell up to the mint cap, if you will have one.",
  "5) Expand the Show/Hide Initial Bonding Setup. Not using an exchange? Set up your base and target mints here, init them if they don't exist yet. Using an Exchange? Paste the Base Voucher Mint in your Base -> Base Voucher Exchange as the existing Base mint here. Likewise, your Target Voucher Mint as the existing token mint.",
  "6) Set up your curve params (step 1), and init the curve, or use an existing curve.",
  "7) Set up a token bonding. Generally, the Freeze Time - Go Live Time = the interval you set for the curve. Set a mint cap to limit how many tokens can be sold, or leave it as 0 to sell unlimited tokens. If you created exchanges, you must provide them here. If you forget, or need to change exchanges later, don't worry, you can register them later in Maintenance Actions. Init when you are ready.",
  "8) That's it! Test it out by making a trade in the but section.",
  "9) Mistake? Need to withdraw funds? Need to give withdraw authority to another wallet? Go to maintenance actions.",
];

export const FAQ = () => {
  return (
    <div className="grid grid-cols-12 gap-2">
      <div className="md:col-span-2" />
      <div className="col-span-12 md:col-span-4 flex">
        <SimpleCard className="flex-1">
          <p className="font-khand text-xl">Liquidity Bootstrap Curve (LBC)</p>
          {lbcFaqDataEnglish.map((item, index) => (
            <Disclosure key={index}>
              {({ open }) => (
                <>
                  <Disclosure.Button className="text-left flex flex-row justify-between">
                    {item.question}
                    <ChevronUpIcon
                      className={`${
                        open ? "rotate-180 transform" : ""
                      } h-5 w-5`}
                    />
                  </Disclosure.Button>
                  <Disclosure.Panel className="text-text-placeholder">
                    {item.answer}
                  </Disclosure.Panel>
                </>
              )}
            </Disclosure>
          ))}
        </SimpleCard>
      </div>
      <div className="col-span-12 md:col-span-4 flex">
        <SimpleCard className="flex-1">
          <p className="font-khand text-xl">
            Concentrated Liquidity Vaults (CLMM)
          </p>
          {clpFaqDataEnglish.map((item, index) => (
            <Disclosure key={index}>
              {({ open }) => (
                <>
                  <Disclosure.Button className="text-left flex flex-row justify-between">
                    {item.question}
                    <ChevronUpIcon
                      className={`${
                        open ? "rotate-180 transform" : ""
                      } h-5 w-5`}
                    />
                  </Disclosure.Button>
                  <Disclosure.Panel className="text-text-placeholder">
                    {item.answer}
                  </Disclosure.Panel>
                </>
              )}
            </Disclosure>
          ))}
        </SimpleCard>
      </div>
      <div className="md:col-span-2" />
    </div>
  );
};
