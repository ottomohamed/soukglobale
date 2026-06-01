import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Star } from "lucide-react";

const activities = [
  { name: "Sophie M.", country: "🇫🇷 France", action: "just purchased", product: "Hand-Painted Zellige Ceramic Bowl", time: "2 min ago", type: "purchase" },
  { name: "James K.", country: "🇺🇸 USA", action: "just purchased", product: "Thuya Wood Marquetry Jewelry Box", time: "4 min ago", type: "purchase" },
  { name: "Lina S.", country: "🇩🇪 Germany", action: "left a 5★ review on", product: "Amazigh Silver Hand of Fatima Pendant", time: "6 min ago", type: "review" },
  { name: "Emily R.", country: "🇬🇧 UK", action: "just purchased", product: "Traditional Moroccan Leather Pouf", time: "8 min ago", type: "purchase" },
  { name: "Carlos V.", country: "🇪🇸 Spain", action: "just purchased", product: "Hand-Carved Alabaster Vase", time: "11 min ago", type: "purchase" },
  { name: "Yuki T.", country: "🇯🇵 Japan", action: "left a 5★ review on", product: "Siwa Oasis Tribal Embroidered Cushion", time: "13 min ago", type: "review" },
  { name: "Marie D.", country: "🇧🇪 Belgium", action: "just purchased", product: "Handwoven Berber Wool Rug — Atlas", time: "15 min ago", type: "purchase" },
  { name: "David L.", country: "🇨🇦 Canada", action: "just purchased", product: "Brass Khan el-Khalili Lantern", time: "17 min ago", type: "purchase" },
  { name: "Anna P.", country: "🇮🇹 Italy", action: "just purchased", product: "Berber Silver Cuff with Coral Inlay", time: "20 min ago", type: "purchase" },
  { name: "Thomas H.", country: "🇦🇺 Australia", action: "left a 5★ review on", product: "Terracotta Tagine with Geometric Motifs", time: "22 min ago", type: "review" },
  { name: "Fatou B.", country: "🇸🇳 Senegal", action: "just purchased", product: "Hand-Painted Papyrus — Queen Nefertiti", time: "25 min ago", type: "purchase" },
  { name: "Laura G.", country: "🇳🇱 Netherlands", action: "just purchased", product: "Copper Lantern with Star Cut-outs", time: "28 min ago", type: "purchase" },
];

export function LiveActivityNotification() {
  const [current, setCurrent] = useState<(typeof activities)[0] | null>(null);
  const [visible, setVisible] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const shuffled = [...activities].sort(() => Math.random() - 0.5);
    let i = 0;

    const show = () => {
      const activity = shuffled[i % shuffled.length];
      setCurrent(activity);
      setVisible(true);
      i++;
      setIndex(i);

      setTimeout(() => setVisible(false), 5000);
    };

    const delay = setTimeout(() => {
      show();
      const interval = setInterval(show, 9000);
      return () => clearInterval(interval);
    }, 3000);

    return () => clearTimeout(delay);
  }, []);

  return (
    <div className="fixed bottom-6 left-6 z-50 max-w-[320px]">
      <AnimatePresence>
        {visible && current && (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="bg-white border border-border shadow-2xl rounded-2xl p-4 flex items-start gap-3"
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${current.type === "purchase" ? "bg-primary/10" : "bg-amber-50"}`}>
              {current.type === "purchase"
                ? <ShoppingBag className="w-5 h-5 text-primary" />
                : <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{current.name} <span className="font-normal text-muted-foreground">{current.country}</span></p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {current.action} <span className="text-foreground font-medium">"{current.product}"</span>
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">{current.time}</p>
            </div>
            <button
              onClick={() => setVisible(false)}
              className="text-muted-foreground/40 hover:text-muted-foreground transition-colors text-lg leading-none flex-shrink-0 -mt-1"
            >×</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
