let characterData = {};
let skillData = {};
let currentCharKey = "Haru";
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

	// 스테이트를 URL로 저장
	function saveStateToUrl() {
		const characterSelect = document.getElementById("characterSelect");
		const params = new URLSearchParams();
		params.set("char", characterSelect.value);

		const secondSelect = document.querySelector(".bonus-select.second");
		const thirdSelect = document.querySelector(".bonus-select.thrid");
		if (secondSelect) params.set("second", secondSelect.value);
		if (thirdSelect) params.set("third", thirdSelect.value);

		const slotImgs = Array.from(document.querySelectorAll(".skill-slot img"));
		const slotKeys = slotImgs.map(img => img.dataset.skillName || "");
		params.set("slots", slotKeys.join(","));

		const url = `${location.pathname}?${params.toString()}`;
		window.history.replaceState({}, "", url);
		return url;
	}

	// URL에서 스테이트 불러오기
	function loadStateFromUrl() {
		const params = new URLSearchParams(location.search);
		const char = params.get("char");
		if (char) {
			const characterSelect = document.getElementById("characterSelect");
			if (characterSelect.value !== char) {
				characterSelect.value = char;
				const ev = new Event('change');
				characterSelect.dispatchEvent(ev);
			}
		}

		const second = params.get("second");
		const third = params.get("third");
		if (second) {
			const secondSelect = document.querySelector(".bonus-select.second");
			if (secondSelect) secondSelect.value = second;
		}
	 	if (third) {
	 		const thirdSelect = document.querySelector(".bonus-select.thrid");
	 		if (thirdSelect) thirdSelect.value = third;
	 	}

	 	const slots = params.get("slots");
	 	if (slots) {
	 		const keys = slots.split(",");
	 		const skillSlots = document.querySelectorAll('.skill-slot');
	 		skillSlots.forEach((slot, idx) => {
	 			const key = keys[idx];
	 			if (key) {
	 				const skill = skillData[key];
	 				if (skill) setSkillToSlot(slot, key, skill);
	 			}
	 		});
	 	}
	}

	// 스크린샷 저장
	async function saveScreenshot() {
		const el = document.querySelector('.main');
	 	if (!el || typeof html2canvas === 'undefined') return;
		const canvas = await html2canvas(el);
		const url = canvas.toDataURL('image/png');
		const a = document.createElement('a');
		a.href = url;
		a.download = 'soulbuild.png';
		a.click();
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

document.addEventListener("DOMContentLoaded", async () => {
	const characterSelect = document.getElementById("characterSelect");
	const characterImage = document.getElementById("characterImage");
	const skillModal = document.getElementById("skillModal");
	const closeModal = document.getElementById("closeModal");
	const saveBtn = document.getElementById('saveScreenshot');
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

	// skill-slot 클릭 이벤트
	document.querySelectorAll(".skill-slot").forEach(slot => {
		slot.addEventListener("click", () => {
			openSkillModal(slot);
		});
	});

	// 스크린샷 버튼
	if (saveBtn) saveBtn.addEventListener('click', () => saveScreenshot());

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