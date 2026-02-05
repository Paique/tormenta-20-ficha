import { useState, useEffect } from 'react';
import { PDFDocument, PDFName } from 'pdf-lib';
import rules from './data/rules.json';
import weaponsData from './data/items/weapons.json';
import armorsData from './data/items/armors.json';
import generalData from './data/items/general.json';
import consumablesData from './data/items/consumables.json';
import powersData from './data/powers.json';
import spellsData from './data/spells.json';
import './App.css';

const skillsList = [
  { name: "Acrobacia", attr: "Des" },
  { name: "Adestramento", attr: "Car" },
  { name: "Atletismo", attr: "For" },
  { name: "Atuação", attr: "Car" },
  { name: "Cavalgar", attr: "Des" },
  { name: "Conhecimento", attr: "Int" },
  { name: "Cura", attr: "Sab" },
  { name: "Diplomacia", attr: "Car" },
  { name: "Enganação", attr: "Car" },
  { name: "Fortitude", attr: "Con" },
  { name: "Furtividade", attr: "Des" },
  { name: "Guerra", attr: "Int" },
  { name: "Iniciativa", attr: "Des" },
  { name: "Intimidação", attr: "Car" },
  { name: "Intuição", attr: "Sab" },
  { name: "Investigação", attr: "Int" },
  { name: "Jogatina", attr: "Car" },
  { name: "Ladinagem", attr: "Des" },
  { name: "Luta", attr: "For" },
  { name: "Misticismo", attr: "Int" },
  { name: "Nobreza", attr: "Int" },
  { name: "Ofício 1", attr: "Int" },
  { name: "Ofício 2", attr: "Int" },
  { name: "Percepção", attr: "Sab" },
  { name: "Pilotagem", attr: "Des" },
  { name: "Pontaria", attr: "Des" },
  { name: "Reflexos", attr: "Des" },
  { name: "Religião", attr: "Sab" },
  { name: "Sobrevivência", attr: "Sab" },
  { name: "Vontade", attr: "Sab" }
];

const skillMap = {
  "Acrobacia": { check: "Mar Trei acro", total: "010" },
  "Adestramento": { check: "Mar Trei ades", total: "020" },
  "Atletismo": { check: "Mar Trei atle", total: "030" },
  "Atuação": { check: "Mar Trei atua", total: "040" },
  "Cavalgar": { check: "Mar Trei caval", total: "050" },
  "Conhecimento": { check: "Mar Trei conhe", total: "060" },
  "Cura": { check: "Mar Trei cura", total: "070" },
  "Diplomacia": { check: "Mar Trei dipl", total: "080" },
  "Enganação": { check: "Mar Trei enga", total: "090" },
  "Fortitude": { check: "Mar Trei forti", total: "100" },
  "Furtividade": { check: "Mar Trei furti", total: "111" },
  "Guerra": { check: "Mar Trei guerra", total: "120" },
  "Iniciativa": { check: "Mar Trei ini", total: "130" },
  "Intimidação": { check: "Mar Trei inti", total: "140" },
  "Intuição": { check: "Mar Trei intu", total: "150" },
  "Investigação": { check: "Mar Trei inve", total: "160" },
  "Jogatina": { check: "Mar Trei joga", total: "170" },
  "Ladinagem": { check: "Mar Trei ladi", total: "180" },
  "Luta": { check: "Mar Trei luta", total: "190" },
  "Misticismo": { check: "Mar Trei misti", total: "200" },
  "Pilotagem": { check: "Mar Trei pilo", total: "210" },
  "Nobreza": { check: "Mar Trei nobre", total: "220" },
  "Ofício 1": { check: "Mar Trei ofi1", total: "230" },
  "Ofício 2": { check: "Mar Trei ofi2", total: "240" },
  "Percepção": { check: "Mar Trei perce", total: "250" },
  "Pontaria": { check: "Mar Trei ponta", total: "260" },
  "Reflexos": { check: "Mar Trei refle", total: "270" },
  "Religião": { check: "Mar Trei reli", total: "280" },
  "Sobrevivência": { check: "Mar Trei sobre", total: "290" },
  "Vontade": { check: "Mar Trei vonta", total: "301" }
};

const ATTRIBUTES = ["For", "Des", "Con", "Int", "Sab", "Car"];

function App() {
  const [formData, setFormData] = useState({
    name: '',
    raceName: rules.races[0].name,
    class: rules.classes[0],
    origin: rules.origins[0],
    god: rules.gods[0],
    level: 1,
    alignment: rules.alignments[4], // Neutro default
    age: '',
    size: 'Médio',
    speed: '9m',
    lore: '',
    baseAttributes: { For: 0, Des: 0, Con: 0, Int: 0, Sab: 0, Car: 0 },
    slectedRaceMods: {},
    skills: {},
    customSkillNames: { "Ofício 1": "", "Ofício 2": "" },
    // Defense
    armorBonus: 0,
    shieldBonus: 0,
    otherDefBonus: 0,
    armorPenalty: 0,
    damageReduction: 0,
    // Lists
    attacks: [],
    inventory: [],
    powers: [],
    spells: [],
    proficiencies: []
  });

  const [pointsSpent, setPointsSpent] = useState(0);
  const [finalAttributes, setFinalAttributes] = useState({ For: 0, Des: 0, Con: 0, Int: 0, Sab: 0, Car: 0 });
  const [skillTotals, setSkillTotals] = useState({});
  const [hp, setHp] = useState({ total: 0, current: 0 });
  const [mp, setMp] = useState({ total: 0, current: 0 });
  const [defenseTotal, setDefenseTotal] = useState(10);
  const [loadLimit, setLoadLimit] = useState(0);
  const [currentLoad, setCurrentLoad] = useState(0);

  // Constants
  const MAX_POINTS = rules.pointBuy.points;
  const POINTS_TABLE = rules.pointBuy.costs;

  useEffect(() => {
    // 1. Calculate Points Spent
    let spent = 0;
    Object.values(formData.baseAttributes).forEach(val => {
      const cost = POINTS_TABLE[String(val)] ?? 0;
      spent += cost;
    });
    setPointsSpent(spent);

    // 2. Calculate Final Attributes (Base + Race)
    const raceDef = rules.races.find(r => r.name === formData.raceName);
    const calculated = { ...formData.baseAttributes };

    if (raceDef && raceDef.mods) {
      ATTRIBUTES.forEach(attr => {
        if (raceDef.mods[attr]) {
          calculated[attr] += raceDef.mods[attr];
        }
      });
      Object.entries(formData.slectedRaceMods).forEach(([attr, val]) => {
        calculated[attr] += val;
      });
    }
    setFinalAttributes(calculated);

    // 3. Calculate Skills
    const halfLevel = Math.floor(formData.level / 2);
    const newSkillTotals = {};
    skillsList.forEach(skill => {
      const isTrained = formData.skills[skill.name];
      const attrVal = calculated[skill.attr];
      const attrMod = attrVal;
      let total = halfLevel + attrMod;
      if (isTrained) total += 2;
      newSkillTotals[skill.name] = total;
    });
    setSkillTotals(newSkillTotals);

    // 4. Calculate HP and MP
    const classDef = rules.classSkills[formData.class];
    if (classDef) {
      const initialHP = classDef.hp + calculated.Con;
      const perLevelHP = classDef.hpPerLevel + calculated.Con;
      const totalHP = initialHP + (formData.level - 1) * perLevelHP;
      const totalMP = classDef.mp * formData.level;

      setHp(prev => ({ total: totalHP, current: prev.current || totalHP }));
      setMp(prev => ({ total: totalMP, current: prev.current || totalMP }));
    }

    // Calculate Defense
    const dexMod = calculated.Des;
    const def = 10 + dexMod + parseInt(formData.armorBonus || 0) + parseInt(formData.shieldBonus || 0) + parseInt(formData.otherDefBonus || 0);
    setDefenseTotal(def);

    // 5. Calculate Load
    setLoadLimit(Math.max(0, calculated.For * 3));

    // Current Load
    const totalLoad = formData.inventory.reduce((acc, item) => acc + (parseFloat(item.load) || 0) * (parseInt(item.qtd) || 1), 0);
    setCurrentLoad(totalLoad);

  }, [formData]);

  // Auto-train fixed class skills on class change
  useEffect(() => {
    const classInfo = rules.classSkills[formData.class];
    if (classInfo) {
      setFormData(prev => {
        const newSkills = {}; // Resetting to avoid "leaking" previous class choices
        // Apply Fixed
        if (classInfo.fixed) {
          classInfo.fixed.forEach(s => newSkills[s] = true);
        }
        // Auto Proficiencies
        const basicProfs = ["Armas Simples", "Armaduras Leves"];
        const newProfs = [...basicProfs, ...(classInfo.prof || [])];

        return { ...prev, skills: newSkills, proficiencies: newProfs };
      });
    }
  }, [formData.class]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addItem = (listName, template) => {
    setFormData(prev => ({
      ...prev,
      [listName]: [...prev[listName], template]
    }));
  };

  const updateItem = (listName, index, field, value) => {
    setFormData(prev => {
      const list = [...prev[listName]];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, [listName]: list };
    });
  };

  const removeItem = (listName, index) => {
    setFormData(prev => {
      const list = [...prev[listName]];
      list.splice(index, 1);
      return { ...prev, [listName]: list };
    });
  };

  const updateAttribute = (attr, delta) => {
    const current = formData.baseAttributes[attr];
    const next = current + delta;
    if (next < -10 || next > 10) return;
    setFormData(prev => ({ ...prev, baseAttributes: { ...prev.baseAttributes, [attr]: next } }));
  };

  const toggleRaceBonus = (attr) => {
    const race = rules.races.find(r => r.name === formData.raceName);
    if (!race.mods.select) return;
    setFormData(prev => {
      const current = prev.slectedRaceMods[attr] || 0;
      const currentCount = Object.keys(prev.slectedRaceMods).length;
      if (current) {
        const next = { ...prev.slectedRaceMods };
        delete next[attr];
        return { ...prev, slectedRaceMods: next };
      } else {
        if (currentCount >= race.mods.select) return prev;
        if (race.mods.exclude && race.mods.exclude.includes(attr)) return prev;
        return { ...prev, slectedRaceMods: { ...prev.slectedRaceMods, [attr]: race.mods.count || 1 } };
      }
    });
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const form = pdfDoc.getForm();

      const allFieldNames = form.getFields().map(f => f.getName());
      const findField = (name) => {
        if (allFieldNames.includes(name)) return name;
        return allFieldNames.find(f => f.toLowerCase() === name.toLowerCase()) || name;
      };

      const getField = (name) => {
        try { return form.getTextField(findField(name)).getText(); } catch (e) { return ""; }
      };
      const getCheck = (name) => {
        try { return form.getCheckBox(findField(name)).isChecked(); } catch (e) { return false; }
      };
      const getDropdown = (name) => {
        try { return form.getDropdown(findField(name)).getSelected()[0]; } catch (e) { return ""; }
      }

      const raceName = getField('RAÇA') || rules.races[0].name;
      const god = getField('DIVINDADE') || rules.gods[0];

      const classLevelStr = getField('CLASSE E NÍVEL') || "";
      let className = getField('CLASSE');
      let levelStr = getField('NIVEL') || getField('NÍVEL') || getField('LEVEL');

      if (!className && classLevelStr) {
        // Attempt to split by space, expecting "Class Level"
        const parts = classLevelStr.split(' ');
        // Assuming last part is level if it's a number
        const lastPart = parts[parts.length - 1];
        if (!isNaN(parseInt(lastPart))) {
          levelStr = lastPart;
          className = parts.slice(0, -1).join(' ');
        } else {
          className = classLevelStr;
        }
      }

      // Metadata normalization/Validation
      const validClass = rules.classes.find(c => c.toLowerCase() === (className || "").toLowerCase()) || rules.classes[0];

      const newForm = {
        name: getField('NOME DO PERSONAGEM'),
        raceName: rules.races.find(r => r.name === raceName) ? raceName : rules.races[0].name,
        class: validClass,
        level: parseInt(levelStr) || 1,
        god: rules.gods.includes(god) ? god : rules.gods[0],
        origin: getField('ORIGEM') || rules.origins[0],
        alignment: getField('ALINHAMENTO') || rules.alignments[4],
        age: getField('IDADE') || getField('Idade'),
        lore: getField('NOTAS') || getField('ANOTAÇÕES') || getField('HISTORIA') || getField('HISTÓRIA') || "",
        size: getDropdown('SeleTamanho') || 'Médio',
        speed: getField('Desloc'),
        baseAttributes: { ...formData.baseAttributes },
        slectedRaceMods: {},
        skills: {},
        armorBonus: getField('B.Arm') || 0,
        shieldBonus: getField('B.Esc') || 0,
        otherDefBonus: getField('Outros B.CA') || 0,
        armorPenalty: getField('PArmTotal') || 0,
        damageReduction: 0,
        attacks: [],
        inventory: [],
        powers: [],
        spells: [],
        proficiencies: [],
        customSkillNames: {
          "Ofício 1": getField('Ofício 1') || getField('Ofício1') || "",
          "Ofício 2": getField('Ofício 2') || getField('Ofício2') || ""
        },
        // We'll trust the calculated PV/PM for now, but could read current if needed
      };

      const pvVal = parseInt(getField('PV')) || 0;
      const pmVal = parseInt(getField('PM')) || 0;
      if (pvVal) setHp(prev => ({ ...prev, current: pvVal }));
      if (pmVal) setMp(prev => ({ ...prev, current: pmVal }));

      const raceDef = rules.races.find(r => r.name === newForm.raceName) || rules.races[0];

      ATTRIBUTES.forEach(attr => {
        const modStr = getField(`Mod${attr}`);
        const finalMod = parseInt(modStr) || 0;
        let raceBonus = raceDef.mods[attr] || 0;
        let base = finalMod - raceBonus;
        newForm.baseAttributes[attr] = base;
      });

      skillsList.forEach(skill => {
        const map = skillMap[skill.name];
        if (map && getCheck(map.check)) {
          newForm.skills[skill.name] = true;
        }
      });

      for (let i = 1; i <= 5; i++) {
        const name = getField(`Ataque ${i}`);
        if (name) {
          newForm.attacks.push({
            name,
            bonus: getField(`Bônus Atq ${i}`),
            damage: getField(`Dano ${i}`),
            crit: getField(`Crítico ${i}`),
            type: getField(`Tipo ${i}`),
            range: getField(`Alcance ${i}`)
          });
        }
      }

      for (let i = 1; i <= 15; i++) {
        const itemStr = getField(`Item${i}`);
        if (itemStr) {
          const match = itemStr.match(/(.*) \(x(\d+)\)/);
          let name = itemStr;
          let qtd = 1;
          if (match) {
            name = match[1];
            qtd = parseInt(match[2]);
          }

          const totalLoad = parseFloat(getField(`PesoItem${i}`)) || 0;
          const unitLoad = qtd > 0 ? totalLoad / qtd : 0;

          newForm.inventory.push({ name, qtd, load: unitLoad });
        }
      }

      const powersText = getField('HabClassePoderes') || "";
      const lines = powersText.split(/\r?\n/).filter(l => l.trim());
      const godPowers = rules.godPowers[newForm.god] || [];
      const knownProficiencies = rules.proficiencies;
      const allPowers = powersData.map(p => p.name);
      const allSpells = spellsData.map(s => s.name);

      lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;

        if (godPowers.includes(trimmed)) {
          newForm.powers.push(trimmed);
        } else if (knownProficiencies.find(p => trimmed.includes(p))) {
          const prof = knownProficiencies.find(p => trimmed.includes(p));
          if (!newForm.proficiencies.includes(prof)) newForm.proficiencies.push(prof);
        } else if (allPowers.includes(trimmed)) {
          newForm.powers.push(trimmed);
        } else if (allSpells.includes(trimmed)) {
          newForm.spells.push(trimmed);
        } else {
          // Fallback: If it's seemingly a generic text, put in powers (likely class features like "Fúria")
          // unless user specifically manages spells separate.
          // For now, default to powers as 'Misc Abilities' logic.
          newForm.powers.push(trimmed);
        }
      });

      const profField = getField('Proficiências');
      if (profField) {
        profField.split(',').forEach(p => {
          const tr = p.trim();
          if (tr && !newForm.proficiencies.includes(tr)) newForm.proficiencies.push(tr);
        });
      }

      setFormData(newForm);
      alert("Ficha importada com sucesso!");
    } catch (error) {
      console.error("Erro import:", error);
      alert("Erro ao ler PDF. Verifique se é um PDF editável oficial.");
    }
  };

  // Helper State
  const [selectedWeaponIdx, setSelectedWeaponIdx] = useState(0);
  const [selectedArmorIdx, setSelectedArmorIdx] = useState(-1);
  const [selectedShieldIdx, setSelectedShieldIdx] = useState(-1);
  const [selectedPowerIdx, setSelectedPowerIdx] = useState(0);

  // Inventory Shop State
  const [shopCategory, setShopCategory] = useState("all");
  const [shopSearch, setShopSearch] = useState("");

  // Spells State
  const [spellCircle, setSpellCircle] = useState(1);
  const [spellSearch, setSpellSearch] = useState("");

  // Combined item list for shop
  const allShopItems = [
    ...weaponsData.map(i => ({ ...i, category: 'Arma', load: i.slots })),
    ...armorsData.map(i => ({ ...i, category: i.category, load: i.slots })),
    ...generalData.map(i => ({ ...i, category: i.type, load: i.slots })),
    ...consumablesData.map(i => ({ ...i, category: i.type, load: i.slots }))
  ].sort((a, b) => a.name.localeCompare(b.name));

  const filteredShopItems = allShopItems.filter(item => {
    const matchCat = shopCategory === "all" ||
      (shopCategory === "Weapons" && item.category === "Arma") ||
      (shopCategory === "Armors" && (item.category === "Leve" || item.category === "Pesada" || item.category === "Escudo")) ||
      (shopCategory === "Consumables" && (item.category === "Poção" || item.category === "Pergaminho" || item.category === "Alquímico")) ||
      (shopCategory === "General" && !["Arma", "Leve", "Pesada", "Escudo", "Poção", "Pergaminho", "Alquímico"].includes(item.category));
    const matchSearch = item.name.toLowerCase().includes(shopSearch.toLowerCase());
    return matchCat && matchSearch;
  });


  const addToInventory = (name, load, qtd = 1, locked = false, sourceType = null) => {
    setFormData(prev => {
      // If adding a locked item (armor/shield), remove previous item of that type first
      let newInventory = [...prev.inventory];

      if (sourceType === 'armor' || sourceType === 'shield') {
        newInventory = newInventory.filter(i => i.sourceType !== sourceType);
      }

      const existingIdx = newInventory.findIndex(i => i.name === name);
      if (existingIdx >= 0) {
        // If it exists, just ensure it's locked if needed? 
        // actually for weapons multiple is fine.
        // For armor/shield we cleared others, so if it still exists it's same name.
        if (sourceType === 'armor' || sourceType === 'shield') {
          // Updating existing (shouldn't happen often if we cleared, but maybe same name)
          const item = newInventory[existingIdx];
          newInventory[existingIdx] = { ...item, locked, sourceType };
          return { ...prev, inventory: newInventory };
        }
        // For weapons, we just append usually
      }

      // Append new
      newInventory.push({ name, qtd, load, locked, sourceType });
      return { ...prev, inventory: newInventory };
    });
  };

  /* Helper for damage reduction */
  const reduceDamageStep = (dmg) => {
    // Basic T20 scale: 1d12 -> 1d10 -> 1d8 -> 1d6 -> 1d4 -> 1d3 -> 1
    // Does not cover all complex cases (like 2d6 -> 1d10) but covers basic simple weapons like Mace.
    const map = {
      '1d12': '1d10',
      '1d10': '1d8',
      '1d8': '1d6',
      '1d6': '1d4',
      '1d4': '1d3',
      '1d3': '1',
      '1d2': '1'
    };
    return map[dmg] || dmg; // Fallback to original if not found
  };

  const handleAddWeapon = () => {
    const w = weaponsData[selectedWeaponIdx];
    let damage = w.damage || '';

    // Apply Small Size reduction
    // Note: In T20, races like Goblin are 'Small' but the rules text often refers to strict size categories.
    // Assuming formData.size stores "Pequeno" or similar.
    // Let's normalize check.
    if (formData.size && formData.size.toLowerCase() === 'pequeno') {
      damage = reduceDamageStep(damage);
    }

    addItem('attacks', {
      name: w.name || '',
      bonus: '', // User calculates
      damage: damage,
      crit: w.critical || '',
      type: w.damageType || '',
      range: w.range || '-'
    });
    addToInventory(w.name, w.slots, 1, true, 'weapon');
  };

  const handleEquipArmor = (e) => {
    const idx = parseInt(e.target.value);
    setSelectedArmorIdx(idx);
    if (idx === -1) return;
    const armor = armorsData[idx];
    setFormData(prev => ({
      ...prev,
      armorBonus: armor.defense,
      armorPenalty: armor.penalty
    }));
    // Auto-add to inventory
    addToInventory(armor.name, armor.slots, 1, true, 'armor');
  };

  const handleEquipShield = (e) => {
    const idx = parseInt(e.target.value);
    setSelectedShieldIdx(idx);
    if (idx === -1) return;
    const shield = armorsData[idx];
    setFormData(prev => ({
      ...prev,
      shieldBonus: shield.defense,
      armorPenalty: prev.armorPenalty + shield.penalty
    }));
    // Auto-add to inventory
    addToInventory(shield.name, shield.slots, 1, true, 'shield');
  };

  const handleAddStartingKit = () => {
    const kit = [
      { name: "Mochila", load: 0 }, // Often treated as 0 or ignored in some tables, but general items has it. Let's lookup.
      { name: "Saco de dormir", load: 1 },
      { name: "Traje de viajante", load: 0 }
    ];

    // Try to find stats in generalData
    const itemsToAdd = kit.map(k => {
      const found = generalData.find(g => g.name === k.name);
      return found ? { name: found.name, load: found.slots, qtd: 1 } : { name: k.name, load: k.load, qtd: 1 };
    });

    setFormData(prev => ({
      ...prev,
      inventory: [...prev.inventory, ...itemsToAdd]
    }));
  };

  const filteredSpells = spellsData.filter(s => {
    const matchCircle = s.circle === parseInt(spellCircle);
    const matchSearch = s.name.toLowerCase().includes(spellSearch.toLowerCase());
    return matchCircle && matchSearch;
  });

  const handleAddSpell = (spell) => {
    const spellStr = spell.name;
    if (!formData.spells.includes(spellStr)) {
      setFormData(prev => ({
        ...prev,
        spells: [...prev.spells, spellStr]
      }));
    }
  };

  const handleAddPower = (idx) => {
    const power = powersData[idx];
    if (!formData.powers.includes(power.name)) {
      setFormData(prev => ({
        ...prev,
        powers: [...prev.powers, power.name]
      }));
    }
  };

  const handleAddPowerFromGod = (powerName) => {
    if (!formData.powers.includes(powerName)) {
      setFormData(prev => ({
        ...prev,
        powers: [...prev.powers, powerName]
      }));
    }
  };



  const generatePDF = async () => {
    const url = `${import.meta.env.BASE_URL}template.pdf`;
    const existingPdfBytes = await fetch(url).then(res => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const form = pdfDoc.getForm();

    // Remove automation/scripts from the PDF
    // 1. Remove Document-level scripts (OpenAction, etc) if possible (tricky with high-level API, focusing on fields first)

    const fields = form.getFields();
    fields.forEach(field => {
      // Remove "RV" (Rich Value) which can contain formatting scripts
      if (field.acroField.dict.has(PDFName.of('RV'))) field.acroField.dict.delete(PDFName.of('RV'));

      // Remove "AA" (Additional Actions) - usually triggers scripts on focus/blur/calculate
      if (field.acroField.dict.has(PDFName.of('AA'))) field.acroField.dict.delete(PDFName.of('AA'));

      // Remove "A" (Action)
      if (field.acroField.dict.has(PDFName.of('A'))) field.acroField.dict.delete(PDFName.of('A'));

      // Ensure ReadOnly flag is OFF so we can edit, but typically we want to set it at the end?
      // For now, just removing the "Computed" flag if it exists is good.
      const flags = field.acroField.getFlags();
      if ((flags & 33554432) !== 0) field.acroField.setFlags(flags & ~33554432); // Remove ReadOnly if set
    });

    // Try to remove AcroForm-level script entries
    // Note: detailed catalog access can be risky if method not available.
    // Focusing on field-level cleaning which covers most automation.


    const allFieldNames = form.getFields().map(f => f.getName());
    const findField = (name) => {
      if (allFieldNames.includes(name)) return name;
      return allFieldNames.find(f => f.trim().toLowerCase() === name.trim().toLowerCase()) || name;
    };

    const safeFill = (name, value) => {
      try {
        const fieldName = findField(name);
        const field = form.getTextField(fieldName);
        if (field) {
          const valStr = value === undefined || value === null ? "" : String(value);
          field.setText(valStr);
        }
      } catch (e) { }
    };

    const safeCheck = (name, checked) => {
      try {
        const field = form.getCheckBox(name);
        if (field && checked) field.check();
        else if (field && !checked) field.uncheck();
      } catch (e) { }
    };

    safeFill('NOME DO PERSONAGEM', formData.name);
    safeFill('RAÇA', formData.raceName);
    safeFill('CLASSE E NÍVEL', `${formData.class} ${formData.level}`);
    safeFill('CLASSE', formData.class);
    safeFill('NIVEL', formData.level);
    safeFill('NÍVEL', formData.level); // Just in case
    safeFill('DIVINDADE', formData.god);
    safeFill('ORIGEM', formData.origin);
    safeFill('JOGADOR', 'T20 Builder');
    safeFill('ALINHAMENTO', formData.alignment);
    safeFill('IDADE', formData.age);
    safeFill('Desloc', formData.speed);

    // Lore / Historia
    safeFill('Anotações', formData.lore);
    safeFill('NOTAS', formData.lore); // Keep as fallback
    safeFill('HISTORIA', formData.lore); // Keep legacy just in case


    try {
      const sizeField = form.getDropdown('SeleTamanho');
      if (sizeField && formData.size) sizeField.select(formData.size);
    } catch (e) { }

    ATTRIBUTES.forEach(attr => {
      const finalVal = finalAttributes[attr];
      const score = 10 + (finalVal % 2 === 0 ? finalVal : finalVal);
      safeFill(attr, finalVal);
      safeFill(`Mod${attr}`, finalVal);
    });

    skillsList.forEach(skill => {
      const map = skillMap[skill.name];
      if (!map) return;
      const isTrained = formData.skills[skill.name];
      const total = skillTotals[skill.name];
      if (isTrained) {
        safeCheck(map.check, true);
      }
      const totalStr = total >= 0 ? `+${total}` : `${total}`;
      safeFill(map.total, totalStr.replace('+', ''));
    });

    safeFill('CA', defenseTotal);
    safeFill('ModAtribDefe', finalAttributes.Des);
    safeFill('B.Arm', formData.armorBonus);
    safeFill('B.Esc', formData.shieldBonus);
    safeFill('Outros B.CA', formData.otherDefBonus);
    safeFill('PArmTotal', formData.armorPenalty);

    formData.attacks.forEach((atk, i) => {
      if (i > 4) return;
      const idx = i + 1;
      safeFill(`Ataque ${idx}`, atk.name);
      safeFill(`Bônus Atq ${idx}`, atk.bonus);
      safeFill(`Dano ${idx}`, atk.damage);
      safeFill(`Crítico ${idx}`, atk.crit);
      safeFill(`Tipo ${idx}`, atk.type);
      safeFill(`Alcance ${idx}`, atk.range);
    });

    formData.inventory.forEach((item, i) => {
      if (i > 14) return;
      const idx = i + 1;
      const nameText = item.qtd > 1 ? `${item.name} (x${item.qtd})` : item.name;
      safeFill(`Item${idx}`, nameText);
      safeFill(`PesoItem${idx}`, (parseFloat(item.load) * parseInt(item.qtd)).toString());
    });
    safeFill('CargaTotal', currentLoad);
    safeFill('CargaMax', loadLimit);

    const powersText = [
      ...formData.powers,
    ].join('\n');
    const spellsText = formData.spells.join('\n');

    safeFill('HabClassePoderes', powersText + "\n\n" + spellsText);
    safeFill('Magias', spellsText);
    safeFill('MAGIAS', spellsText);
    safeFill('Proficiências', formData.proficiencies.join(', '));
    safeFill('HabRaçasOrigem', `Origem: ${formData.origin}`);

    // PV & PM
    safeFill('PV', hp.total);
    safeFill('PM', mp.total);
    safeFill('PV Atual', hp.current);
    safeFill('PM Atual', mp.current);

    // Custom Skills
    Object.entries(formData.customSkillNames).forEach(([key, val]) => {
      if (val) safeFill(key, val);
    });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `Ficha_${formData.name || 'T20'}.pdf`;
    link.click();
  };

  const handlePowerToggle = (power) => {
    // 1. Thyatis Validation
    if (formData.god === "Thyatis") {
      if (power === "Dom da Imortalidade") {
        if (formData.class !== "Paladino") {
          alert("Dom da Imortalidade é exclusivo para Paladinos.");
          return;
        }
        if (formData.powers.includes("Dom da Ressurreição")) {
          alert("Você não pode ter Dom da Imortalidade e Dom da Ressurreição simultaneamente.");
          return;
        }
      }
      if (power === "Dom da Ressurreição") {
        if (formData.class !== "Clérigo") {
          alert("Dom da Ressurreição é exclusivo para Clérigos.");
          return;
        }
        if (formData.powers.includes("Dom da Imortalidade")) {
          alert("Você não pode ter Dom da Imortalidade e Dom da Ressurreição simultaneamente.");
          return;
        }
      }
    }

    setFormData(prev => {
      const isActive = prev.powers.includes(power);
      if (isActive) {
        return { ...prev, powers: prev.powers.filter(p => p !== power) };
      } else {
        if (formData.god === "Thyatis" && power === "Dom da Imortalidade") {
          return { ...prev, powers: [...prev.powers.filter(p => p !== "Dom da Ressurreição"), power] };
        }
        if (formData.god === "Thyatis" && power === "Dom da Ressurreição") {
          return { ...prev, powers: [...prev.powers.filter(p => p !== "Dom da Imortalidade"), power] };
        }
        return { ...prev, powers: [...prev.powers, power] };
      }
    });
  };

  const getWarnings = () => {
    const warns = [];
    const { god, class: className } = formData;
    if (className === "Paladino" && (god === "Lena" || god === "Marah")) warns.push("⚠️ Paladinos de Lena ou Marah não podem usar o poder 'Arma Sagrada'.");
    if (god === "Allihanna") warns.push("⚠️ Proibido usar armaduras e escudos de metal (perde poderes).");
    if (god === "Megalokk") {
      warns.push("⚠️ Proibido usar perícias de Inteligência ou Carisma (exceto Adestramento e Intimidação).");
      warns.push("⚠️ Proibido lançar magias sustentadas.");
    }
    if (god === "Lena") {
      warns.push("⚠️ Proibido causar dano letal. Magias de cura curam +1PV/dado.");
      warns.push("⚠️ Proibido lançar 'Arma Espiritual'.");
    }
    if (god === "Marah") {
      warns.push("⚠️ Proibido causar qualquer dano (letal ou não) ou violência.");
      warns.push("⚠️ Proibido lançar 'Arma Espiritual'.");
    }
    if (god === "Thyatis") warns.push("ℹ️ Escolha: Dom da Imortalidade (Paladino) OU Dom da Ressurreição (Clérigo).");
    return warns;
  };

  const getRaceBonusStatus = () => {
    const race = rules.races.find(r => r.name === formData.raceName);
    if (!race.mods.select) return null;
    const current = Object.keys(formData.slectedRaceMods).length;
    return `Escolha ${race.mods.select} (Selecionados: ${current})`;
  };

  const copyLorePrompt = () => {
    const prompt = `Crie uma história de fundo (lore) rica e envolvente para um personagem de RPG Tormenta 20 com as seguintes características:

Nome: ${formData.name || 'Sem nome'}
Raça: ${formData.raceName}
Classe: ${formData.class} (Nível ${formData.level})
Divindade: ${formData.god}
Origem: ${formData.origin}
Alinhamento: ${formData.alignment}
Idade: ${formData.age || 'Desconhecida'}

Atributos Finais:
Força: ${finalAttributes.For}
Destreza: ${finalAttributes.Des}
Constituição: ${finalAttributes.Con}
Inteligência: ${finalAttributes.Int}
Sabedoria: ${finalAttributes.Sab}
Carisma: ${finalAttributes.Car}

Poderes e Habilidades:
${formData.powers.join(', ')}

Equipamento Principal:
${formData.inventory.filter(i => i.load > 0).map(i => i.name).join(', ')}

Por favor, escreva uma biografia que explique como esse personagem obteve sua classe, sua relação com a divindade e o motivo de se tornar um aventureiro.`;

    navigator.clipboard.writeText(prompt);
    alert("Prompt copiado para a área de transferência! Cole no ChatGPT/Gemini para gerar sua lore.");
  };

  return (
    <div className="container">
      <header>
        <h1>⚔️ Tormenta 20 Builder</h1>
        <p>Criador de Fichas Completo - Jogo do Ano</p>
        <div className="import-section">
          <label className="btn-secondary">
            📂 Importar PDF
            <input type="file" accept=".pdf" onChange={handleImport} style={{ display: 'none' }} />
          </label>
        </div>
      </header>

      {getWarnings().length > 0 && (
        <div className="warnings-banner">
          {getWarnings().map((w, i) => <div key={i}>{w}</div>)}
        </div>
      )}

      {/* BIO CARD */}
      <div className="card">
        <h2>Dados Principais</h2>
        <div className="grid-3">
          <div className="field">
            <label>Nome</label>
            <input name="name" value={formData.name} onChange={handleChange} />
          </div>
          <div className="field">
            <label>Raça</label>
            <select name="raceName" value={formData.raceName} onChange={(e) => setFormData({ ...formData, raceName: e.target.value, baseAttributes: { For: 0, Des: 0, Con: 0, Int: 0, Sab: 0, Car: 0 }, slectedRaceMods: {} })}>
              {rules.races.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Classe</label>
            <select name="class" value={formData.class} onChange={handleChange}>
              {rules.classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Origem</label>
            <select name="origin" value={formData.origin} onChange={handleChange}>
              {rules.origins.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Nível</label>
            <input type="number" name="level" value={formData.level} onChange={handleChange} min="1" max="20" />
          </div>
          <div className="field">
            <label>Divindade</label>
            <select name="god" value={formData.god} onChange={handleChange}>
              {rules.gods.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Alinhamento</label>
            <select name="alignment" value={formData.alignment} onChange={handleChange}>
              {rules.alignments.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Idade</label>
            <input name="age" value={formData.age} onChange={handleChange} />
          </div>
          <div className="field">
            <label>Tamanho</label>
            <select name="size" value={formData.size} onChange={handleChange}>
              {rules.sizes.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Deslocamento</label>
            <input name="speed" value={formData.speed} onChange={handleChange} placeholder="Ex: 9m" />
          </div>
          <div className="field full-width" style={{ gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
              <label style={{ marginBottom: 0 }}>História / Descrição</label>
              <button
                onClick={copyLorePrompt}
                className="btn-secondary"
                style={{ fontSize: '0.8rem', padding: '2px 8px' }}
                title="Gera um prompt com seus dados para IA criar sua história"
              >
                🤖 Copiar Prompt para IA
              </button>
            </div>
            <textarea
              name="lore"
              value={formData.lore}
              onChange={handleChange}
              style={{ width: '100%', height: '80px', padding: '8px' }}
              placeholder="Escreva a história do seu personagem..."
            />
          </div>
        </div>
      </div>

      {/* ATTRIBUTES */}
      <div className="card">
        <div className="attr-header">
          <h2>Atributos</h2>
          <div className={`points-display ${pointsSpent > MAX_POINTS ? 'error' : ''}`}>
            Pontos Gastos: {pointsSpent} / {MAX_POINTS}
          </div>
        </div>
        <p className="hint">Cada atributo começa em 0. Custo: 1:1, 2:2, 3:4, 4:7. Limite inicial: 4.</p>
        <div className="attributes-grid">
          {ATTRIBUTES.map(attr => {
            const race = rules.races.find(r => r.name === formData.raceName);
            const isFlexible = race?.mods?.select && (!race.mods.exclude || !race.mods.exclude.includes(attr));
            const isSelected = formData.slectedRaceMods[attr];
            const raceMod = race?.mods?.[attr] || 0;

            return (
              <div key={attr} className={`attr-row ${isSelected ? 'selected-bonus' : ''}`}>
                <label>{attr}</label>
                <div className="attr-controls">
                  <button onClick={() => updateAttribute(attr, -1)} disabled={formData.baseAttributes[attr] <= -10}>-</button>
                  <span className="attr-value">{formData.baseAttributes[attr]}</span>
                  <button onClick={() => updateAttribute(attr, 1)} disabled={formData.baseAttributes[attr] >= 10}>+</button>
                </div>
                <div className="attr-race-mod">
                  {raceMod ? <span className="mod-badge">+{raceMod}</span> : null}
                  {isFlexible && (
                    <label className="flex-bonus" title="Bônus Racial (+1)">
                      <input type="checkbox" checked={!!isSelected} onChange={() => toggleRaceBonus(attr)} />
                      +1
                    </label>
                  )}
                </div>
                <div className="attr-final">
                  Total: <strong>{finalAttributes[attr]}</strong>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PV & PM */}
      <div className="card">
        <div className="grid grid-2">
          <div className="stat-box">
            <label>Pontos de Vida (PV)</label>
            <div className="stat-controls">
              <input
                type="number"
                value={hp.current}
                onChange={(e) => setHp({ ...hp, current: parseInt(e.target.value) || 0 })}
              />
              <span>/ {hp.total}</span>
            </div>
          </div>
          <div className="stat-box">
            <label>Pontos de Mana (PM)</label>
            <div className="stat-controls">
              <input
                type="number"
                value={mp.current}
                onChange={(e) => setMp({ ...mp, current: parseInt(e.target.value) || 0 })}
              />
              <span>/ {mp.total}</span>
            </div>
          </div>
        </div>
      </div>

      {/* COMBAT & DEFENSE */}
      <div className="card">
        <h2>Combate & Defesa</h2>
        <div className="defense-panel">
          <div className="def-display">
            <div className="def-total">
              <span className="label">DEFESA</span>
              <span className="value">{defenseTotal}</span>
            </div>
            <div className="def-formula">
              10 + Des({finalAttributes.Des}) + Armadura({formData.armorBonus}) + Escudo({formData.shieldBonus}) + Outros({formData.otherDefBonus})
            </div>
          </div>

          <div className="equipment-selects grid grid-2" style={{ marginBottom: '15px' }}>
            <div className="field">
              <label>Equipar Armadura</label>
              <select onChange={handleEquipArmor} value={selectedArmorIdx}>
                <option value={-1}>-- Personalizado / Nenhuma --</option>
                {armorsData.filter(a => a.category !== 'Escudo').map((a, i) => (
                  <option key={a.name} value={armorsData.indexOf(a)}>{a.name} (Def+{a.defense}, Pen{a.penalty})</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Equipar Escudo</label>
              <select onChange={handleEquipShield} value={selectedShieldIdx}>
                <option value={-1}>-- Personalizado / Nenhum --</option>
                {armorsData.filter(a => a.category === 'Escudo').map((a, i) => (
                  <option key={a.name} value={armorsData.indexOf(a)}>{a.name} (Def+{a.defense}, Pen{a.penalty})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="def-inputs grid-3">
            <div className="field">
              <label>Bônus Armadura</label>
              <input type="number" name="armorBonus" value={formData.armorBonus} onChange={handleChange} />
            </div>
            <div className="field">
              <label>Bônus Escudo</label>
              <input type="number" name="shieldBonus" value={formData.shieldBonus} onChange={handleChange} />
            </div>
            <div className="field">
              <label>Outros Defesa</label>
              <input type="number" name="otherDefBonus" value={formData.otherDefBonus} onChange={handleChange} />
            </div>
            <div className="field">
              <label>Penalidade Armadura</label>
              <input type="number" name="armorPenalty" value={formData.armorPenalty} onChange={handleChange} />
            </div>
          </div>
        </div>

        <h3>Ataques</h3>
        <div className="list-controls" style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <select
            value={selectedWeaponIdx}
            onChange={(e) => setSelectedWeaponIdx(parseInt(e.target.value))}
            style={{ flex: 1 }}
          >
            {weaponsData.map((w, i) => (
              <option key={i} value={i}>{w.name} ({w.proficiency} - {w.damage})</option>
            ))}
          </select>
          <button onClick={handleAddWeapon} className="btn-secondary">Adicionar Arma</button>
        </div>
        <div className="list-container">
          {formData.attacks.map((atk, idx) => (
            <div key={idx} className="list-item">
              <input placeholder="Nome" value={atk.name} onChange={e => updateItem('attacks', idx, 'name', e.target.value)} className="w-wide" />
              <input placeholder="Bônus" value={atk.bonus} onChange={e => updateItem('attacks', idx, 'bonus', e.target.value)} className="w-small" />
              <input placeholder="Dano" value={atk.damage} onChange={e => updateItem('attacks', idx, 'damage', e.target.value)} className="w-med" />
              <input placeholder="Crítico" value={atk.crit} onChange={e => updateItem('attacks', idx, 'crit', e.target.value)} className="w-small" />
              <button onClick={() => removeItem('attacks', idx)} className="btn-del">X</button>
            </div>
          ))}
          <button onClick={() => addItem('attacks', { name: '', bonus: '', damage: '', crit: '', type: '', range: '' })} className="btn-add">+ Ataque Personalizado</button>
        </div>
      </div>

      {/* INVENTORY */}
      <div className="card">
        <div className="attr-header">
          <h2>Equipamento</h2>
          <div className={`points-display ${currentLoad > loadLimit ? 'error' : ''}`}>
            Carga: {currentLoad} / {loadLimit} (Espaços)
          </div>
        </div>
        <p className="hint">Força {finalAttributes.For} x 3 = {loadLimit} Espaços</p>
        <div className="shop-section" style={{ background: '#f0f9ff', padding: '10px', borderRadius: '8px', marginBottom: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h4>Loja Rápida</h4>
            <button onClick={handleAddStartingKit} className="btn-secondary" style={{ fontSize: '0.8rem' }}>+ Kit Inicial</button>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <select value={shopCategory} onChange={(e) => setShopCategory(e.target.value)}>
              <option value="all">Todos</option>
              <option value="Weapons">Armas</option>
              <option value="Armors">Armaduras/Escudos</option>
              <option value="Consumables">Consumíveis</option>
              <option value="General">Geral/Ferramentas</option>
            </select>
            <input
              placeholder="Buscar item..."
              value={shopSearch}
              onChange={(e) => setShopSearch(e.target.value)}
              style={{ flex: 1 }}
            />
          </div>
          <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #ddd', background: 'white' }}>
            {filteredShopItems.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 10px', borderBottom: '1px solid #eee' }}>
                <span>{item.name} <small style={{ color: '#888' }}>({item.load} slots - T$ {item.price})</small></span>
                <button
                  onClick={() => addItem('inventory', { name: item.name, qtd: 1, load: item.load })}
                  style={{ background: '#e0f2fe', color: '#0284c7', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 8px' }}
                >
                  +
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="list-container">
          {formData.inventory.map((item, idx) => (
            <div key={idx} className="list-item">
              <input placeholder="Item" value={item.name} onChange={e => updateItem('inventory', idx, 'name', e.target.value)} className="w-wide" readOnly={item.locked} />
              <input placeholder="Qtd" type="number" value={item.qtd} onChange={e => updateItem('inventory', idx, 'qtd', e.target.value)} className="w-small" />
              <input placeholder="Espaços" type="number" value={item.load} onChange={e => updateItem('inventory', idx, 'load', e.target.value)} className="w-small" />
              <button
                onClick={() => !item.locked && removeItem('inventory', idx)}
                className="btn-del"
                disabled={item.locked}
                title={item.locked ? "Remova este item através da seção de Combate/Defesa" : "Remover item"}
                style={item.locked ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
              >
                X
              </button>
            </div>
          ))}
          <button onClick={() => addItem('inventory', { name: '', qtd: 1, load: 1 })} className="btn-add">+ Item Personalizado</button>
        </div>
      </div>

      {/* SPELLS */}
      <div className="card">
        <h2>Magias</h2>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <select value={spellCircle} onChange={(e) => setSpellCircle(e.target.value)} style={{ width: '100px' }}>
            <option value={1}>1º Círculo</option>
            <option value={2}>2º Círculo</option>
            <option value={3}>3º Círculo</option>
            <option value={4}>4º Círculo</option>
            <option value={5}>5º Círculo</option>
          </select>
          <input
            placeholder="Buscar magia..."
            value={spellSearch}
            onChange={(e) => setSpellSearch(e.target.value)}
            style={{ flex: 1 }}
          />
        </div>

        <div className="spell-browser" style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '15px', background: '#fff' }}>
          {filteredSpells.length === 0 ? (
            <p style={{ padding: '10px', color: '#888' }}>
              {spellsData.length === 0 ? "Erro: spells.json vazio ou não carregado." : "Nenhuma magia encontrada."}
            </p>
          ) : (
            filteredSpells.map((spell, idx) => (
              <div key={idx} style={{ padding: '8px', borderBottom: '1px solid #eee', background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 600, color: '#4b5563' }}>{spell.name}</div>
                  <button
                    onClick={() => handleAddSpell(spell)}
                    style={{ background: '#7c3aed', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 8px', cursor: 'pointer', fontSize: '0.9rem' }}
                    title="Aprender Magia"
                  >
                    +
                  </button>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '2px' }}>
                  <span style={{ color: spell.type === 'Arcana' ? '#d946ef' : spell.type === 'Divina' ? '#eab308' : '#6366f1', fontWeight: 'bold' }}>
                    {spell.type}
                  </span>
                  • {spell.school} • {spell.execution} • {spell.range} • {spell.duration}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#374151' }}>
                  {spell.description}
                </div>
              </div>
            ))
          )}
        </div>

        <h3>Magias Conhecidas</h3>
        <div className="list-container">
          {formData.spells.map((spell, idx) => (
            <div key={idx} className="list-item">
              <span style={{ flex: 1 }}>{spell}</span>
              <button
                onClick={() => removeItem('spells', idx)}
                className="btn-del"
                title="Esquecer Magia"
              >
                X
              </button>
            </div>
          ))}
          {formData.spells.length === 0 && <p className="hint">Nenhuma magia aprendida.</p>}
        </div>
      </div>

      {/* ABILITIES & POWERS */}
      <div className="card">
        <h2>Habilidades & Poderes</h2>

        <div style={{ marginBottom: '20px', background: '#fdf2f2', padding: '10px', borderRadius: '8px' }}>
          <h4>Adicionar Poder</h4>
          <div style={{ display: 'flex', gap: '10px' }}>
            <select
              value={selectedPowerIdx}
              onChange={(e) => setSelectedPowerIdx(parseInt(e.target.value))}
              style={{ flex: 1 }}
            >
              {powersData.map((p, i) => (
                <option key={i} value={i}>{p.name} ({p.category})</option>
              ))}
            </select>
            <button onClick={() => handleAddPower(selectedPowerIdx)} className="btn-secondary">Adicionar</button>
          </div>
          <div style={{ marginTop: '5px', fontSize: '0.9rem', color: '#666' }}>
            <em>{powersData[selectedPowerIdx].description}</em>
          </div>
        </div>

        <h3>Poderes Adquiridos</h3>
        <div className="list-container">
          {formData.powers.map((power, idx) => (
            <div key={idx} className="list-item">
              <span style={{ flex: 1 }}>{power}</span>
              <button
                onClick={() => handlePowerToggle(power)}
                className="btn-del"
                title="Remover Poder"
              >
                X
              </button>
            </div>
          ))}
          {formData.powers.length === 0 && <p className="hint">Nenhum poder adquirido.</p>}
        </div>

        <h3>Poderes Divinos ({formData.god})</h3>
        <p className="hint" style={{ marginBottom: '10px' }}>
          Deuses concedem poderes aos devotos. Paladinos (Abençoado) podem escolher 2, outros devotos escolhem 1.
          Adicione manualmente os poderes desejados abaixo:
        </p>
        <div className="tags-container">
          {rules.godPowers[formData.god] && rules.godPowers[formData.god].map(power => {
            const added = formData.powers.includes(power);
            return (
              <button
                key={power}
                className={`tag-btn ${added ? 'added' : ''}`}
                onClick={() => {
                  if (added) handlePowerToggle(power); // Allow removing if already added
                  else handleAddPowerFromGod(power);
                }}
                disabled={added} // Visual feedback
                style={{ opacity: added ? 0.6 : 1, cursor: added ? 'default' : 'pointer' }}
              >
                {added ? "✓ " : "+ "}{power}
              </button>
            );
          })}
        </div>

        <h3>Proficiências</h3>
        <div className="tags-container">
          {rules.proficiencies.map(prof => (
            <label key={prof} className="tag-check">
              <input
                type="checkbox"
                checked={formData.proficiencies.includes(prof)}
                onChange={() => {
                  const newP = formData.proficiencies.includes(prof)
                    ? formData.proficiencies.filter(p => p !== prof)
                    : [...formData.proficiencies, prof];
                  setFormData({ ...formData, proficiencies: newP });
                }}
              />
              {prof}
            </label>
          ))}
        </div>

        <h3>Outras Habilidades / Magias</h3>
        <textarea
          className="w-full h-32"
          placeholder="Digite outras habilidades, talentos ou magias aqui..."
          value={formData.spells.join('\n')}
          onChange={(e) => setFormData({ ...formData, spells: e.target.value.split('\n') })}
        ></textarea>
      </div>

      <div className="card">
        <div className="attr-header">
          <h2>Perícias</h2>
          <div className={`points-display ${Object.keys(formData.skills).length > (rules.classSkills[formData.class]?.count + Math.max(0, finalAttributes.Int) + rules.classSkills[formData.class]?.fixed?.length + (rules.classSkills[formData.class]?.selectFixed?.count || 0) + (formData.originSkillBonus || 0)) ? 'error' : ''}`}>
            Treinadas: {
              Object.keys(formData.skills).length
            } / {
              (rules.classSkills[formData.class]?.fixed?.length || 0) +
              (rules.classSkills[formData.class]?.selectFixed?.count || 0) +
              (rules.classSkills[formData.class]?.count || 0) +
              Math.max(0, finalAttributes.Int) +
              (formData.originSkillBonus || 0)
            }
          </div>
        </div>
        <div style={{ padding: '0 20px 15px', color: '#666', fontSize: '0.9rem' }}>
          Limite: Classes ({rules.classSkills[formData.class]?.count || 0}) +
          Int ({Math.max(0, finalAttributes.Int)}) +
          Origem (
          <input
            type="number"
            min="0"
            max="10"
            className="input-num-small"
            style={{ width: '40px', marginLeft: '5px' }}
            value={formData.originSkillBonus || 0}
            onChange={(e) => setFormData(prev => ({ ...prev, originSkillBonus: parseInt(e.target.value) || 0 }))}
          />
          )
        </div>
        <div className="skills-grid">
          {skillsList.map(skill => {
            const classInfo = rules.classSkills[formData.class];
            const isFixed = classInfo?.fixed?.includes(skill.name);
            const isSelectFixed = classInfo?.selectFixed?.list?.includes(skill.name);
            const isChoice = classInfo?.choices?.includes(skill.name);
            const isTrained = formData.skills[skill.name];

            let label = "";
            if (isFixed) label = " (Fixa)";
            else if (isSelectFixed) label = " (Classe - Escolha Fixa)";
            else if (isChoice) label = " (Classe)";

            return (
              <div
                key={skill.name}
                className={`skill-row ${isTrained ? 'trained' : ''} ${isFixed ? 'fixed-skill' : ''}`}
                onClick={() => {
                  if (isFixed) return; // Cannot uncheck fixed
                  setFormData(prev => {
                    const currentTrained = Object.keys(prev.skills).length;
                    const limit = (classInfo?.fixed?.length || 0) +
                      (classInfo?.selectFixed?.count || 0) +
                      (classInfo?.count || 0) +
                      Math.max(0, finalAttributes.Int) +
                      (prev.originSkillBonus || 0);

                    if (!isTrained && currentTrained >= limit) {
                      alert("Limite de perícias treinadas atingido!");
                      return prev;
                    }

                    const newSkills = { ...prev.skills };
                    if (isTrained) delete newSkills[skill.name];
                    else newSkills[skill.name] = true;
                    return { ...prev, skills: newSkills };
                  });
                }}
              >
                <input type="checkbox" checked={!!isTrained} readOnly />
                <span className="skill-name">
                  {skill.name.includes("Ofício") ? (
                    <input
                      className="skill-input"
                      placeholder={skill.name}
                      value={formData.customSkillNames[skill.name]}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          customSkillNames: {
                            ...formData.customSkillNames,
                            [skill.name]: e.target.value
                          }
                        });
                      }}
                    />
                  ) : skill.name} <small>({skill.attr})</small>
                  {label && <span className="skill-label">{label}</span>}
                </span>
                <span className="skill-total">
                  {skillTotals[skill.name] >= 0 ? `+${skillTotals[skill.name]}` : skillTotals[skill.name]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="actions">
        <button onClick={generatePDF} className="btn-primary" disabled={pointsSpent > MAX_POINTS}>
          Baixar PDF Preenchido
        </button>
      </div>
    </div>
  );
}

export default App;
