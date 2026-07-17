import { motion, useReducedMotion } from 'framer-motion'

const letters = ['v', 'i', 'g', 'o']

function AnimatedWordmark() {
  const reduceMotion = useReducedMotion()

  return (
    <div className="flex w-full items-center justify-center overflow-hidden py-6 sm:py-10">
      <h1
        className="font-brand select-none text-center text-[clamp(6rem,22vw,18rem)] font-black leading-[0.72] tracking-[-0.105em] text-black"
        style={{ fontVariationSettings: "'wdth' 110, 'wght' 950" }}
        aria-label="VIGO"
      >
        {letters.map((letter, index) => (
          <motion.span
            key={`${letter}-${index}`}
            aria-hidden="true"
            className="inline-block origin-bottom will-change-transform"
            animate={
              reduceMotion
                ? undefined
                : {
                    y: [0, 0, -8, 0, 0],
                    scaleY: [1, 1, 1.045, 1, 1],
                    color: ['#000000', '#000000', '#2563eb', '#000000', '#000000'],
                  }
            }
            transition={{
              duration: 2.8,
              delay: index * 0.18,
              times: [0, 0.34, 0.5, 0.66, 1],
              ease: 'easeInOut',
              repeat: Infinity,
              repeatDelay: 1.1,
            }}
          >
            {letter}
          </motion.span>
        ))}
      </h1>
    </div>
  )
}

export default AnimatedWordmark
