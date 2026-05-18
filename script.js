let characterData = {};
let skillData = {};
let arData = {};
let weaponData = {};
let currentCharKey = "Haru";
let currentWeaponKey = "";
let selectedSlot = null;

const characters = {
	char1: { image: "image/Player/Main_A.png", charKey: "Haru" },
	char2: { image: "image/Player/Main_B.png", charKey: "Erwin" },
	char3: { image: "image/Player/Main_C.png", charKey: "Lily" },
	char4: { image: "image/Player/Main_D.png", charKey: "Stella" },
	char5: { image: "image/Player/Main_E.png", charKey: "Jin" },
	char6: { image: "image/Player/Main_F.png", charKey: "Iris" },
	char7: { image: "image/Player/Main_G.png", charKey: "Chii" },
	char8: { image: "image/Player/Main_H.png", charKey: "Ephnel" },
	char9: { image: "image/Player/Main_I.png", charKey: "Inabi" },
	char10: { image: "image/Player/Main_J.png", charKey: "Dhana" },
};

// JSON 데이터 로드
async function loadJsonData() {
	try {
		const characterResponse = await fetch("Json/character.json");
		characterData = await characterResponse.json();
		
		const skillResponse = await fetch("Json/skill.json");
		skillData = await skillResponse.json();

		const arResponse = await fetch("Json/ar.json");
		arData = await arResponse.json();

		const weaponResponse = await fetch("Json/weapon.json");
		weaponData = await weaponResponse.json();
	} catch (error) {
		console.error("JSON 파일 로드 실패:", error);
	}
}

// 기본 스킬을 skill-slot에 표시
function displayDefaultSkills(charKey) {
	if (!characterData[charKey]) return;
	
	const defaultSkills = characterData[charKey].defaultSkills;
	const skillSlots = document.querySelectorAll(".skill-slot");
	
	skillSlots.forEach((slot, index) => {
		slot.innerHTML = "";
		
		if (index < defaultSkills.length) {
			const skillName = defaultSkills[index];
			const skill = skillData[skillName];
			
			if (skill) {
				const img = document.createElement("img");
				img.src = skill.icon;
				img.alt = skill.name;
				img.dataset.skillName = skillName;
				img.title = skill.name;
				slot.appendChild(img);
			}
		}
	});
}

	// 스테이트를 URL로 저장 (스킬은 인덱스로 압축)
	function saveStateToUrl() {
		const characterSelect = document.getElementById("characterSelect");
		const params = new URLSearchParams();
		params.set("c", characterSelect.value);

		const secondSelect = document.querySelector(".bonus-select.second");
		const thirdSelect = document.querySelector(".bonus-select.thrid");
		if (secondSelect) params.set("s", secondSelect.value);
		if (thirdSelect) params.set("t", thirdSelect.value);

		// 스킬을 인덱스로 변환
		const slotImgs = Array.from(document.querySelectorAll(".skill-slot img"));
		const availableSkills = characterData[currentCharKey]?.availableSkills || [];
		const slotIndices = slotImgs.map(img => {
			const skillName = img.dataset.skillName || "";
			if (!skillName) return "";
			return availableSkills.indexOf(skillName);
		});
		params.set("sk", slotIndices.join(","));

		// 아카식 상태 (key 리스트)
		// 아카식 상태: index 기반 압축 인코딩
		const allArKeys = Object.keys(arData);
		const arSlots = Array.from(document.querySelectorAll('.akashic-slot'));
		const arIndices = arSlots.map(s => {
			const img = s.querySelector('img');
			if (!img || !img.dataset.arKey) return '';
			const key = img.dataset.arKey;
			const idx = allArKeys.indexOf(key);
			return idx >= 0 ? String(idx) : '';
		});
		params.set('ar', arIndices.join(','));
		if (currentWeaponKey) params.set('w', currentWeaponKey);

		const url = `${location.pathname}?${params.toString()}`;
		window.history.replaceState({}, "", url);
		return url;
	}

	// URL에서 스테이트 불러오기 (인덱스를 스킬 이름으로 변환)
	function loadStateFromUrl() {
		const params = new URLSearchParams(location.search);
		const char = params.get("c");
		if (char) {
			const characterSelect = document.getElementById("characterSelect");
			if (characterSelect.value !== char) {
				characterSelect.value = char;
				const ev = new Event('change');
				characterSelect.dispatchEvent(ev);
			}
		}

		const second = params.get("s");
		const third = params.get("t");
		if (second) {
			const secondSelect = document.querySelector(".bonus-select.second");
			if (secondSelect) secondSelect.value = second;
		}
	 	if (third) {
	 		const thirdSelect = document.querySelector(".bonus-select.thrid");
	 		if (thirdSelect) thirdSelect.value = third;
	 	}

	 	const weaponKey = params.get("w");
	 	const sk = params.get("sk");
	 	if (sk) {
	 		const indices = sk.split(",");
	 		const availableSkills = characterData[currentCharKey]?.availableSkills || [];
	 		const skillSlots = document.querySelectorAll('.skill-slot');
	 		skillSlots.forEach((slot, idx) => {
	 			const indexStr = indices[idx];
	 			if (indexStr !== undefined && indexStr !== "") {
	 				const index = parseInt(indexStr);
	 				const skillName = availableSkills[index];
	 				if (skillName) {
	 					const skill = skillData[skillName];
	 					if (skill) setSkillToSlot(slot, skillName, skill);
	 				}
	 			}
	 		});
	 	}

		if (weaponKey) {
			const validWeapon = weaponData[weaponKey] && weaponData[weaponKey].characters.includes(currentCharKey);
			if (validWeapon) {
				setWeaponToSlot(weaponKey, weaponData[weaponKey]);
			} else {
				displayWeapon(currentCharKey, true);
			}
		} else {
			displayWeapon(currentCharKey, true);
		}

		// 아카식 상태 로드
		const arParam = params.get('ar');
		if (arParam) {
			const parts = arParam.split(',');
			// 숫자 인코딩인지 감지 (빈 문자열 또는 숫자만 있으면 인덱스 인코딩)
			const isIndexEncoding = parts.every(p => p === '' || /^\d+$/.test(p));
			let keys = parts;
			if (isIndexEncoding) {
				const allArKeys = Object.keys(arData);
				keys = parts.map(p => (p === '' ? '' : (allArKeys[parseInt(p)] || '')));
			}
			const akSlots = document.querySelectorAll('.akashic-slot');
			const usedTags = new Set(); // 이미 적용된 태그 추적
			const usedKeys = new Set();
			akSlots.forEach((slot, idx) => {
				const key = keys[idx];
				if (key) {
					const ar = arData[key];
					if (ar) {
						// 코어 아카식은 6번째 슬롯(코어 슬롯)에서만 적용
						const isCoreSlot = slot.classList.contains('core');
						if (ar.core && !isCoreSlot) return;
						if (!ar.core && isCoreSlot) return;
						// 이미 동일 AR이 장착되어 있다면 건너뛰기
						if (usedKeys.has(key)) return;
						// 같은 태그가 이미 사용 중이면 건너뛰기
						if (ar.tag && ar.tag !== '' && usedTags.has(ar.tag)) return;
						setArToSlot(slot, key, ar);
						// 태그/키 기록 (빈 태그는 제외)
						if (ar.tag && ar.tag !== '') usedTags.add(ar.tag);
						usedKeys.add(key);
					}
				}
			});
		}
	}

// 보너스 설정 초기화
function setDefaultBonus(charKey) {
	if (!characterData[charKey] || !characterData[charKey].bonus) return;
	
	const bonus = characterData[charKey].bonus;
	
	// step2 보너스 (second)
	if (bonus.step2 !== undefined) {
		const secondSelect = document.querySelector(".bonus-select.second");
		if (secondSelect) {
			secondSelect.selectedIndex = bonus.step2;
			bonusState["tiersecond"] = secondSelect.value;
		}
	}
	
	// step3 보너스 (third)
	if (bonus.step3 !== undefined) {
		const thirdSelect = document.querySelector(".bonus-select.thrid");
		if (thirdSelect) {
			thirdSelect.selectedIndex = bonus.step3;
			bonusState["tierthrid"] = thirdSelect.value;
		}
	}
}

// 스킬 선택 모달 열기
function openSkillModal(slot) {
	selectedSlot = slot;
	const skillModal = document.getElementById("skillModal");
	const skillList = document.getElementById("skillList");
	
	skillList.innerHTML = "";
	
	const availableSkills = characterData[currentCharKey]?.availableSkills || [];
	
	availableSkills.forEach(skillName => {
		const skill = skillData[skillName];
		if (skill) {
			const skillItem = document.createElement("div");
			skillItem.className = "skill-item";
			skillItem.innerHTML = `
				<img src="${skill.icon}" alt="${skill.name}">
				<span>${skill.name}</span>
			`;
			skillItem.addEventListener("click", () => {
				setSkillToSlot(slot, skillName, skill);
				skillModal.classList.add("hidden");
			});
			skillList.appendChild(skillItem);
		}
	});
	
	skillModal.classList.remove("hidden");
}

// 선택한 스킬을 슬롯에 설정
function setSkillToSlot(slot, skillName, skill) {
	slot.innerHTML = "";
	const img = document.createElement("img");
	img.src = skill.icon;
	img.alt = skill.name;
	img.title = skill.name;
	img.dataset.skillName = skillName;
	slot.appendChild(img);

	// 상태 URL 업데이트
	saveStateToUrl();
}

function displayWeapon(charKey, forceDefault = false) {
	const weaponSlot = document.getElementById('weaponSlot');
	if (!weaponSlot) return;

	const available = Object.entries(weaponData).filter(([, weapon]) => weapon.characters.includes(charKey));
	if (available.length === 0) {
		weaponSlot.innerHTML = '<span>무기 없음</span>';
		currentWeaponKey = "";
		return;
	}

	// 현재 선택 무기가 없거나 캐릭터가 바뀌었을 때 기본 무기 설정
	const validCurrent = currentWeaponKey && weaponData[currentWeaponKey] && weaponData[currentWeaponKey].characters.includes(charKey);
	if (!validCurrent || forceDefault) {
		currentWeaponKey = available[0][0];
	}

	const weapon = weaponData[currentWeaponKey];
	if (weapon) {
		setWeaponToSlot(currentWeaponKey, weapon, false);
	} else {
		weaponSlot.innerHTML = '<span>무기 선택</span>';
	}
}

function openWeaponModal() {
	selectedSlot = null;
	const weaponModal = document.getElementById('weaponModal');
	const weaponList = document.getElementById('weaponList');
	const available = Object.entries(weaponData).filter(([, weapon]) => weapon.characters.includes(currentCharKey));
	weaponList.innerHTML = '';

	available.forEach(([key, weapon]) => {
		const item = document.createElement('div');
		item.className = 'skill-item';
		item.innerHTML = `
			<img src="${weapon.icon}" alt="${weapon.name || key}">
			<span>${weapon.name || key}</span>
		`;
		item.addEventListener('click', () => {
			setWeaponToSlot(key, weapon);
			weaponModal.classList.add('hidden');
		});
		weaponList.appendChild(item);
	});

	weaponModal.classList.remove('hidden');
}

function setWeaponToSlot(weaponKey, weapon, save = true) {
	currentWeaponKey = weaponKey;
	const weaponSlot = document.getElementById('weaponSlot');
	if (!weaponSlot) return;
	weaponSlot.innerHTML = '';
	const img = document.createElement('img');
	img.src = weapon.icon;
	img.alt = weapon.name || weaponKey;
	img.title = weapon.name || weaponKey;
	img.dataset.weaponKey = weaponKey;
	weaponSlot.appendChild(img);
	const label = document.createElement('span');
	label.textContent = weapon.name || weaponKey;
	weaponSlot.appendChild(label);
	if (save) saveStateToUrl();
}

// --- 아카식 관련 함수 ---
function displayAkashics(charKey) {
	if (!characterData[charKey]) return;
	const keys = characterData[charKey].akashics || [];
	const slots = document.querySelectorAll('.akashic-slot');
	slots.forEach((slot, idx) => {
		slot.innerHTML = '';
		const key = keys[idx];
		if (key && arData[key]) {
			const ar = arData[key];
			const img = document.createElement('img');
			img.src = ar.icon;
			img.alt = ar.name;
			img.title = ar.name;
			img.dataset.arKey = key;
			slot.appendChild(img);
		}
	});
}

function openArModal(slot) {
	selectedSlot = slot;
	const arModal = document.getElementById('arModal');
	const arList = document.getElementById('arList');
	arList.innerHTML = '';

	// 다른 슬롯에서 이미 사용 중인 태그 수집
	const usedTags = new Set();
	const usedKeys = new Set();
	const allSlots = document.querySelectorAll('.akashic-slot');
	allSlots.forEach((s) => {
		if (s === slot) return; // 현재 슬롯은 제외
		const img = s.querySelector('img');
		if (img && img.dataset.arKey) {
			usedKeys.add(img.dataset.arKey);
			const ar = arData[img.dataset.arKey];
			if (ar && ar.tag && ar.tag !== '') usedTags.add(ar.tag);
		}
	});

	const isCoreSlot = slot.classList.contains('core');
	Object.keys(arData).forEach(key => {
		const ar = arData[key];
		// core 아이템은 코어 슬롯에서만 선택 가능
		if (ar.core && !isCoreSlot) return;
		if (!ar.core && isCoreSlot) return;
		// 이미 동일 AR이 장착되어 있다면 표시 안 함
		if (usedKeys.has(key)) return;
		// 같은 태그가 이미 사용 중이면 표시 안 함
		if (ar.tag && ar.tag !== '' && usedTags.has(ar.tag)) return;
		
		const item = document.createElement('div');
		item.className = 'skill-item';
		item.innerHTML = `\n            <img src="${ar.icon}" alt="${ar.name}">\n            <span>${ar.name}</span>\n        `;
		item.addEventListener('click', () => {
			setArToSlot(slot, key, ar);
			arModal.classList.add('hidden');
		});
		arList.appendChild(item);
	});

	arModal.classList.remove('hidden');
}

function setArToSlot(slot, arKey, ar) {
	if (!slot) return;
	slot.innerHTML = '';
	const img = document.createElement('img');
	img.src = ar.icon;
	img.alt = ar.name;
	img.title = ar.name;
	img.dataset.arKey = arKey;
	slot.appendChild(img);
	saveStateToUrl();
}

document.addEventListener("DOMContentLoaded", async () => {
	const characterSelect = document.getElementById("characterSelect");
	const characterImage = document.getElementById("characterImage");
	const skillModal = document.getElementById("skillModal");
	const closeModal = document.getElementById("closeModal");
	const copyBtn = document.getElementById('copyUrl');

	// JSON 데이터 로드
	await loadJsonData();

	// 첫 번째 옵션으로 초기화
	characterSelect.selectedIndex = 0;
	const init = characters[characterSelect.value];
	characterImage.src = init.image;
	currentCharKey = init.charKey;
	displayDefaultSkills(init.charKey);
	setDefaultBonus(init.charKey);
	// 아카식 표시 초기화
	displayAkashics(init.charKey);
		displayWeapon(init.charKey);

	// skill-slot 클릭 이벤트
	document.querySelectorAll(".skill-slot").forEach(slot => {
		slot.addEventListener("click", () => {
			openSkillModal(slot);
		});
	});

	// 아카식 슬롯 클릭 이벤트
	document.querySelectorAll('.akashic-slot').forEach(slot => {
		slot.addEventListener('click', () => openArModal(slot));
	});

	// URL 복사 버튼
	if (copyBtn) copyBtn.addEventListener('click', async () => {
		saveStateToUrl();
		try {
			await navigator.clipboard.writeText(location.href);
			alert('설정 URL이 복사되었습니다.');
		} catch (e) {
			prompt('설정 URL:', location.href);
		}
	});

		// 아카식 모달 닫기
		const arModal = document.getElementById('arModal');
		const closeArModal = document.getElementById('closeArModal');
		if (closeArModal) closeArModal.addEventListener('click', () => arModal.classList.add('hidden'));
		if (arModal) arModal.addEventListener('click', (e) => { if (e.target === arModal) arModal.classList.add('hidden'); });

		const weaponModal = document.getElementById('weaponModal');
		const closeWeaponModal = document.getElementById('closeWeaponModal');
		if (closeWeaponModal) closeWeaponModal.addEventListener('click', () => weaponModal.classList.add('hidden'));
		if (weaponModal) weaponModal.addEventListener('click', (e) => { if (e.target === weaponModal) weaponModal.classList.add('hidden'); });

		const weaponSlot = document.getElementById('weaponSlot');
		if (weaponSlot) {
			weaponSlot.addEventListener('click', () => openWeaponModal());
		}

	// 모달 닫기 버튼
	closeModal.addEventListener("click", () => {
		skillModal.classList.add("hidden");
	});

	// 모달 배경 클릭 시 닫기
	skillModal.addEventListener("click", (e) => {
		if (e.target === skillModal) {
			skillModal.classList.add("hidden");
		}
	});

	// URL에서 상태 로드 (초기화 후 적용)

	// characterSelect change 내부 핸들러 (초기화 후 이벤트 연결)
	characterSelect.addEventListener('change', () => {
		const data = characters[characterSelect.value];
		characterImage.src = data.image;
		currentCharKey = data.charKey;
		displayDefaultSkills(data.charKey);
		setDefaultBonus(data.charKey);
		displayAkashics(data.charKey);
		displayWeapon(data.charKey, true);
		saveStateToUrl();
	});

	// URL에서 상태 로드 (초기화 후 적용)
	loadStateFromUrl();
});

const bonusState = {};

document.querySelectorAll(".bonus-select").forEach(select => {
	const bonusName = select.getAttribute('bonus') || (select.classList.contains('second') ? 'second' : 'thrid');

	bonusState[`tier${bonusName}`] = select.value;

	select.addEventListener("change", () => {
		bonusState[`tier${bonusName}`] = select.value;
		saveStateToUrl();
	});
});