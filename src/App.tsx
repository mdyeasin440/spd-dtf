// 1. Initialize from local cache immediately (no blank screen or delay)
const [presets, setPresets] = useState<DesignPreset[]>(() => {
  return getLocalPresets();
});

// 2. Fetch and merge from Cloudflare D1 on mount (loads custom presets in any browser)
useEffect(() => {
  let isMounted = true;
  fetchPresetsFromD1().then((d1Presets) => {
    if (isMounted && d1Presets && d1Presets.length > 0) {
      setPresets(d1Presets);
    }
  });
  return () => {
    isMounted = false;
  };
}, []);

// 3. Keep local cache synchronized with current state
useEffect(() => {
  saveLocalPresets(presets);
}, [presets]);
