
const  {
	DFA,
	NFA,
	minimizeDFA,
	inverseDFA,
	determineNFA
} = require('../automat.js');

const {MapOfMap} = require('@grunmouse/special-map');
/**
 * @struct DFA
 * @property A : Iterable - алфавит
 * @property Q : Iterable - множество состояний
 * @property s - начальное состояние s \in Q
 * @property T : Set<Q> - множество допускающих состояний T \subset Q
 * @property d : MapOfMap<Q, A, Q> - таблица переходов
 *
 */


/**
 
 * @return DFA
 */
function oneString(str, abc){
	abc = abc || str
	
	const A = new Set(abc);
	const len = str.length;
	const Q = Array.from({length:len+1}, (_, i)=>(i));
	const s = 0;
	const T = new Set([len]);
	
	const d = new MapOfMap();
	for(let i=0; i<len; ++i){
		d.set(i, str[i], i+1);
	}
	
	return new DFA({A, Q, s, T, d, devil:true});
}


module.exports = {
	oneString
};