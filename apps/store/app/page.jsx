"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowUpRight,
  Menu,
  X,
  ShoppingBag,
  Check,
  Minus,
  Plus,
  Star,
  ArrowRight,
  ChevronDown,
  UserRound,
} from "lucide-react";

const desk = "/images/lumadesk-product-master.png";
const CART_STORAGE_KEY = "lumadesk-cart-v1";
// Canonical LumaDesk product image supplied by the brand. Future finish variants
// must be direct edits of this locked composition, never a recreated scene.
const productVariants = {
  natural: { label: "Natural white oak", swatch: "#d8c8a3", frames: { black: desk, white: "/products/variants/05-natural-white-oak-matte-white.png" } },
  walnut: { label: "American walnut", swatch: "#704b36", frames: { black: "/products/variants/02-american-walnut-matte-black.png", aluminum: "/products/variants/06-american-walnut-brushed-aluminum.png" } },
  smoked: { label: "Smoked oak", swatch: "#4b3328", frames: { black: "/products/variants/03-smoked-oak-matte-black.png" } },
  ash: { label: "Matte black ash", swatch: "#252525", frames: { black: "/products/variants/04-matte-black-ash-matte-black.png" } },
};
const frameNames = { black: "Matte black", white: "Matte white", aluminum: "Brushed aluminum" };
const frameColors = { black: "#111111", white: "#f4f1e9", aluminum: "#b7b8b6" };
const variantSlugs = { natural: { black: "natural-white-oak-matte-black", white: "natural-white-oak-matte-white" }, walnut: { black: "american-walnut-matte-black", aluminum: "american-walnut-brushed-aluminum" }, smoked: { black: "smoked-oak-matte-black" }, ash: { black: "matte-black-ash-matte-black" } };
const features = [
  [
    "01",
    "Quietly powerful",
    "Twin motors rise in near silence — 38dB at full speed.",
  ],
  [
    "02",
    "Built to outlast",
    "Solid white oak. Precision-milled aluminum. A desk made for decades.",
  ],
  [
    "03",
    "Knows your rhythm",
    "Four programmable heights remember exactly where you do your best work.",
  ],
];
const reviews = [
  [
    "“The one piece in my office that makes every other decision feel better.”",
    "Maya R.",
    "Brooklyn, NY",
  ],
  [
    "“Beautifully quiet, absurdly solid. It changed my posture — and my afternoons.”",
    "Elliot S.",
    "San Francisco, CA",
  ],
  [
    "“It has the restraint of a great tool. Nothing extra, everything considered.”",
    "Nora K.",
    "Chicago, IL",
  ],
];
const rise = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } };
const MotionImage = motion.create(Image);
function Reveal({ children, className = "", delay = 0 }) {
  return (
    <motion.div
      className={className}
      variants={rise}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
function App() {
  const [cart, setCart] = useState(false),
    [menu, setMenu] = useState(false),
    [qty, setQty] = useState(1),
    [finish, setFinish] = useState("natural"),
    [finishPickerOpen, setFinishPickerOpen] = useState(false),
    [frame, setFrame] = useState("black"),
    [scrolled, setScrolled] = useState(false),
    [email, setEmail] = useState(""),
    [subscribed, setSubscribed] = useState(false),
    [isLoading, setIsLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [cartItem, setCartItem] = useState(null);
  const [cartHydrated, setCartHydrated] = useState(false);
  const [signedIn, setSignedIn] = useState(null);
  const [accountMenu, setAccountMenu] = useState(false);
  const finishPickerRef = useRef(null);
  const accountMenuRef = useRef(null);
  const selectedFinish = productVariants[finish];
  const deskImage = selectedFinish.frames[frame] || selectedFinish.frames.black;
  const changeFinish = (next) => {
    setFinish(next);
    setFrame("black");
    setFinishPickerOpen(false);
  };
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    try {
      const savedCart = window.localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (productVariants[parsed.finish]?.frames[parsed.frame] && Number.isInteger(parsed.quantity) && parsed.quantity >= 1 && parsed.quantity <= 10) {
          setCartItem(parsed);
        }
      }
    } catch {
      window.localStorage.removeItem(CART_STORAGE_KEY);
    } finally {
      setCartHydrated(true);
    }
  }, []);
  useEffect(() => {
    if (!cartHydrated) return;
    if (cartItem) window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItem));
    else window.localStorage.removeItem(CART_STORAGE_KEY);
  }, [cartHydrated, cartItem]);
  useEffect(() => {
    const supabase = createClient();
    const syncUser = async () => {
      const { data } = await supabase.auth.getUser();
      setSignedIn(Boolean(data.user));
    };
    void syncUser();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setSignedIn(Boolean(session?.user)));
    return () => listener.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!accountMenu) return;
    const dismiss = (event) => {
      if (!accountMenuRef.current?.contains(event.target)) setAccountMenu(false);
    };
    const dismissOnEscape = (event) => {
      if (event.key === "Escape") setAccountMenu(false);
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", dismissOnEscape);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", dismissOnEscape);
    };
  }, [accountMenu]);
  const add = () => {
    setCartItem({ finish, frame, quantity: qty });
    setCart(true);
  };
  const changeFrame = (next) => {
    if (next !== frame) setFrame(next);
  };
  const subscribe = async (e) => {
    e.preventDefault();
    const response = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    if (response.ok) setSubscribed(true);
  };
  const beginCheckout = async () => {
    if (!cartItem) return;
    setIsLoading(true);
    const params = new URLSearchParams({ variantSlug: variantSlugs[cartItem.finish][cartItem.frame], quantity: String(cartItem.quantity) });
    window.location.assign(`/checkout?${params.toString()}`);
  };
  const saveConfiguration = async () => {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { window.location.assign("/login?next=/#shop"); return; }
    const { data: variant } = await supabase.from("product_variants").select("id").eq("slug", variantSlugs[finish][frame]).single();
    if (!variant) return;
    const { error } = await supabase.from("wishlist_items").upsert({ user_id: auth.user.id, variant_id: variant.id }, { onConflict: "user_id,variant_id" });
    if (!error) setSaved(true);
  };
  const closeMenu = () => setMenu(false);
  return (
    <>
      <header className={scrolled ? "is-scrolled" : ""}>
        <a className="brand" href="#top">
          Luma<span>Desk</span>
        </a>
        <nav>
          <a href="#design">Design</a>
          <a href="#specs">Specifications</a>
          <a href="#stories">Stories</a>
          <a href="#support">Support</a>
        </nav>
        <div className="header-actions">
          {signedIn ? <div className="account-menu" ref={accountMenuRef}>
            <button className="account-trigger" type="button" onClick={() => setAccountMenu((open) => !open)} aria-label="Open account menu" aria-expanded={accountMenu} aria-controls="account-menu">
              <UserRound size={17} strokeWidth={1.8} />
            </button>
            <AnimatePresence>
              {accountMenu && <motion.div id="account-menu" className="account-popover" role="menu" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.16 }}>
                <a href="/orders" role="menuitem">Orders</a>
                <a href="/settings" role="menuitem">Settings</a>
                <form action="/auth/signout" method="post"><button type="submit" role="menuitem">Sign out</button></form>
              </motion.div>}
            </AnimatePresence>
          </div> : signedIn === false ? <><a className="account-link" href="/login">Sign in</a><a className="account-link account-link-create" href="/register">Create account</a></> : null}
          <button
            className="bag"
            onClick={() => setCart(true)}
            aria-label="Open cart"
          >
            <ShoppingBag size={18} />
            {cartItem && <i />}
          </button>
        </div>
        <button
          className="menub"
          onClick={() => setMenu(!menu)}
          aria-label={menu ? "Close menu" : "Open menu"}
          aria-expanded={menu}
        >
          {menu ? <X /> : <Menu />}
        </button>
      </header>
      <AnimatePresence>
        {menu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
            className="mobile-nav"
          >
            <a onClick={closeMenu} href="#design">
              Design
            </a>
            <a onClick={closeMenu} href="#specs">
              Specifications
            </a>
            <a onClick={closeMenu} href="#stories">
              Stories
            </a>
            {signedIn ? <a onClick={closeMenu} href="/orders">My orders</a> : <><a onClick={closeMenu} href="/login">Sign in</a><a onClick={closeMenu} href="/register">Create account</a></>}
            <button onClick={() => { closeMenu(); setCart(true); }}>Open bag</button>
            <button
              onClick={() => {
                closeMenu();
                add();
              }}
            >
              Shop LumaDesk Pro
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">
              THE NEW LUMADESK PRO <b>•</b> 2026
            </p>
            <h1>
              Elevate your work.
              <br />
              <em>Transform your life.</em>
            </h1>
            <p className="lede">
              A standing desk crafted with an uncompromising belief: the objects
              you work with should make you feel more capable.
            </p>
            <div className="hero-actions">
              <button
                className="primary hero-cta"
                onClick={() =>
                  document
                    .getElementById("shop")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
              >
                Configure your LumaDesk <ArrowUpRight size={17} />
              </button>
            </div>
          </div>
          <div className="hero-art">
            <Image
              src={desk}
              alt="LumaDesk Pro oak standing desk in a quiet modern workspace"
              fill
              loading="eager"
              sizes="(max-width: 700px) 100vw, 55vw"
            />
            <div className="hero-note">
              Natural white oak
              <br />
              <b>From $1,895</b>
            </div>
          </div>
          <div className="scroll">
            SCROLL TO EXPLORE <span>↓</span>
          </div>
        </section>
        <section className="manifesto" id="design">
          <Reveal>
            <p className="eyebrow">MORE THAN A DESK</p>
            <h2>
              Your best work deserves
              <br />a better place to happen.
            </h2>
            <p>
              Designed in Copenhagen and engineered in California, LumaDesk Pro
              is the quiet center of a more intentional workday.
            </p>
          </Reveal>
        </section>
        <section className="feature-wrap">
          {features.map(([n, t, d], i) => (
            <Reveal className="feature" delay={i * 0.08} key={n}>
              <span>{n}</span>
              <div>
                <h3>{t}</h3>
                <p>{d}</p>
                <a href="#specs">
                  Explore the details <ArrowRight size={15} />
                </a>
              </div>
            </Reveal>
          ))}
        </section>
        <section className="image-break">
          <Image
            src={desk}
            alt="Close view of the LumaDesk Pro"
            width={1200}
            height={900}
            sizes="(max-width: 700px) 100vw, 55vw"
          />
          <Reveal>
            <p className="eyebrow">MADE TO MOVE</p>
            <h2>
              Movement,
              <br />
              <em>made effortless.</em>
            </h2>
            <p>
              The LumaDrive™ system brings an unusually smooth, considered
              experience to every transition. From sitting to standing in 9
              seconds flat.
            </p>
            <button className="text-btn">
              Discover LumaDrive <ArrowUpRight size={16} />
            </button>
          </Reveal>
        </section>
        <section className="specs" id="specs">
          <Reveal>
            <p className="eyebrow">ENGINEERING, REFINED</p>
            <h2>
              Considered
              <br />
              from every angle.
            </h2>
          </Reveal>
          <div className="spec-grid">
            {[
              ["01", "Height range", "24.5 — 50.2 in"],
              ["02", "Load capacity", "350 lb"],
              ["03", "Rise speed", "1.7 in / sec"],
              ["04", "Warranty", "5 years"],
            ].map(([n, label, value], i) => (
              <Reveal key={n} delay={i * 0.07}>
                <b>{n}</b>
                <span>{label}</span>
                <strong>{value}</strong>
              </Reveal>
            ))}
          </div>
        </section>
        <section className="product" id="shop">
          <div className="product-img">
            <AnimatePresence mode="wait">
              <MotionImage
                key={`${finish}-${frame}`}
                className="product-photo"
                initial={{ opacity: 0, scale: 1.015 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                src={deskImage}
                alt={`LumaDesk Pro in ${selectedFinish.label} with ${frameNames[frame]} frame`}
                fill
                sizes="(max-width: 700px) 100vw, 55vw"
              />
            </AnimatePresence>
            <span>{selectedFinish.label.toUpperCase()} / {frameNames[frame].toUpperCase()}</span>
          </div>
          <Reveal className="product-info">
            <p className="eyebrow">THE FLAGSHIP</p>
            <h2>LumaDesk Pro</h2>
            <p className="price">From $1,895</p>
            <p>
              Made-to-order, delivered in 2–3 weeks. Complimentary white-glove
              delivery in the continental US.
            </p>
            <div className="selectors">
              <div>
                <div className="finish-picker" ref={finishPickerRef} onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setFinishPickerOpen(false);
              }}>
                <label id="desktop-finish-label">Desktop finish</label>
                <button
                  className="choice"
                  type="button"
                  aria-labelledby="desktop-finish-label desktop-finish-value"
                  aria-haspopup="listbox"
                  aria-expanded={finishPickerOpen}
                  onClick={() => setFinishPickerOpen((isOpen) => !isOpen)}
                  onKeyDown={(event) => {
                    if (["ArrowDown", "ArrowUp", " "].includes(event.key)) {
                      event.preventDefault();
                      setFinishPickerOpen(true);
                    }
                  }}
                >
                  <i className="choice-swatch" style={{ background: selectedFinish.swatch }} />
                  <span id="desktop-finish-value">{selectedFinish.label}</span>
                  <ChevronDown size={16} />
                </button>
                <AnimatePresence>
                  {finishPickerOpen && (
                    <motion.div
                      className="finish-menu"
                      role="listbox"
                      aria-labelledby="desktop-finish-label"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {Object.entries(productVariants).map(([id, option]) => (
                        <button
                          type="button"
                          key={id}
                          className={finish === id ? "selected" : ""}
                          role="option"
                          aria-selected={finish === id}
                          onClick={() => changeFinish(id)}
                        >
                          <i style={{ background: option.swatch }} />
                          <span>{option.label}</span>
                          {finish === id && <Check size={14} strokeWidth={2.4} />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
                </div>
              </div>
              <div>
                <label>Frame</label>
                <div
                  className="dots"
                  role="radiogroup"
                  aria-label="Frame color"
                >
                  {Object.keys(selectedFinish.frames).map((id) => <button key={id} className={`frame-option ${frame === id ? "active" : ""}`} style={{ "--frame-swatch": frameColors[id] }} onClick={() => changeFrame(id)} aria-label={frameNames[id]} role="radio" aria-checked={frame === id} />)}
                </div>
              </div>
            </div>
            <div className="buy">
              <div>
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  aria-label="Decrease quantity"
                >
                  <Minus size={15} />
                </button>
                <span aria-live="polite">{qty}</span>
                <button
                  onClick={() => setQty(qty + 1)}
                  aria-label="Increase quantity"
                >
                  <Plus size={15} />
                </button>
              </div>
              <button className="primary" onClick={add}>
                Add to bag — ${1895 * qty}
              </button>
            </div>
            <small>
              <Check size={14} /> Ships free · 30-day home trial
            </small>
            <button className="text-btn" type="button" onClick={saveConfiguration}>{saved ? "Saved to wishlist" : "Save this configuration"}</button>
          </Reveal>
        </section>
        <section className="quotes" id="stories">
          <Reveal>
            <p className="eyebrow">IN THEIR WORDS</p>
            <h2>Work, elevated.</h2>
          </Reveal>
          <div>
            {reviews.map((r, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <article>
                  <div className="stars">★★★★★</div>
                  <blockquote>{r[0]}</blockquote>
                  <p>
                    <b>{r[1]}</b>
                    <br />
                    {r[2]}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>
        <section className="newsletter" id="support">
          <Reveal>
            <p className="eyebrow">STAY IN THE LOOP</p>
            <h2>
              For a more
              <br />
              <em>intentional workday.</em>
            </h2>
            <form onSubmit={subscribe}>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                type="email"
                required
                aria-label="Email address"
              />
              <button aria-label="Subscribe">
                <ArrowRight size={20} />
              </button>
            </form>
            <small aria-live="polite">
              {subscribed
                ? "You’re on the list."
                : "New product notes, studio visits, and considered ideas. No noise."}
            </small>
          </Reveal>
        </section>
      </main>
      <footer>
        <a className="brand">
          Luma<span>Desk</span>
        </a>
        <p>Work, elevated.</p>
        <div>
          <a href="/shipping">Shipping</a>
          <a href="/returns">Returns</a>
          <a href="/order-lookup">Order lookup</a>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
        </div>
        <small>© 2026 LumaDesk, Inc.</small>
      </footer>
      <AnimatePresence>
        {cart && (
          <>
            <motion.button
              aria-label="Close cart"
              className="cart-scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCart(false)}
            />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="Shopping bag"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{
                type: "tween",
                duration: 0.35,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="cart"
            >
              <div className="cart-head">
                <h2>Your bag</h2>
                <button onClick={() => setCart(false)} aria-label="Close cart">
                  <X />
                </button>
              </div>
              {cartItem ? (
                <>
                  <div className="cart-item">
                    <Image
                      src={productVariants[cartItem.finish].frames[cartItem.frame]}
                      alt="LumaDesk Pro"
                      width={100}
                      height={100}
                      sizes="100px"
                    />
                    <div>
                      <b>LumaDesk Pro</b>
                      <p>{productVariants[cartItem.finish].label} / {frameNames[cartItem.frame]}</p>
                      <strong>${1895 * cartItem.quantity}</strong>
                      <button
                        className="remove"
                        onClick={() => setCartItem(null)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="cart-bottom">
                    <div>
                      <span>Subtotal</span>
                      <b>${1895 * cartItem.quantity}</b>
                    </div>
                    <p>Complimentary delivery included</p>
                    <button
                      disabled={isLoading}
                      className="primary"
                      onClick={beginCheckout}
                    >
                      {isLoading ? (
                        "Preparing checkout…"
                      ) : (
                        <>
                          Continue to checkout <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <div className="empty">
                  <span className="empty-kicker">Your selection</span>
                  <div className="empty-icon" aria-hidden="true">
                    <ShoppingBag size={24} strokeWidth={1.5} />
                  </div>
                  <h3>Nothing here yet.</h3>
                  <p>Your bag is waiting for something exceptional.</p>
                  <button onClick={() => setCart(false)} className="text-btn">
                    Continue browsing <span aria-hidden="true"><ArrowRight size={13} /></span>
                  </button>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default App;
