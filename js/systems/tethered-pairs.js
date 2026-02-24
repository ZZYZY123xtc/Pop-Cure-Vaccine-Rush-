/**
 * Simplified Level 14 tether system.
 *
 * Rules:
 * 1) Two viruses can be linked by a tether line.
 * 2) If one of the pair dies, the link breaks immediately.
 * 3) The surviving partner enters enraged mode immediately.
 * 4) If both are killed in the same lightning batch, no enraged trigger.
 */
export class TetheredPairSystem {
    constructor() {
        this.pairs = [];
        this.isActive = false;
        this.config = {
            linkColor: ['#FFB7C5', '#BCA9E8'],
            linkWidth: 10,
            glowBlur: 15
        };
        console.log('[TetheredPairs] initialized');
    }

    activate() {
        this.isActive = true;
        this.pairs = [];
        console.log('[TetheredPairs] activated');
    }

    deactivate() {
        this.isActive = false;
        this.pairs = [];
    }

    createPair(virus1, virus2) {
        if (!this.isActive || !virus1 || !virus2) return null;

        const pair = {
            id: `pair_${Date.now()}_${Math.random()}`,
            virus1,
            virus2
        };

        virus1.tetheredPairId = pair.id;
        virus2.tetheredPairId = pair.id;
        virus1.isTethered = true;
        virus2.isTethered = true;
        virus1.isEnraged = false;
        virus2.isEnraged = false;

        this.pairs.push(pair);
        console.log('[TetheredPairs] create pair:', pair.id);
        return pair;
    }

    /**
     * @param {Object} deadVirus
     * @param {Array<Object>} allViruses
     * @param {Object} options
     * @param {Set<number>} options.simultaneousKilledIds - ids killed by the same lightning batch
     * @returns {boolean}
     */
    onVirusKilled(deadVirus, allViruses, options = {}) {
        if (!this.isActive || !deadVirus?.isTethered) return true;

        const pairIndex = this.pairs.findIndex((pair) => pair.id === deadVirus.tetheredPairId);
        if (pairIndex < 0) return true;

        const pair = this.pairs[pairIndex];
        const partner = pair.virus1 === deadVirus ? pair.virus2 : pair.virus1;
        const simultaneousKilledIds = options.simultaneousKilledIds instanceof Set
            ? options.simultaneousKilledIds
            : null;

        const partnerMarkedBySameBatch = !!(partner && simultaneousKilledIds?.has(partner.id));
        const partnerStillAlive = !!(partner && allViruses.includes(partner) && partner.hp > 0);

        if (partnerStillAlive && !partnerMarkedBySameBatch) {
            partner.isEnraged = true;
        }

        this.detachVirus(deadVirus);
        this.detachVirus(partner);
        this.pairs.splice(pairIndex, 1);

        return true;
    }

    update(dt, allViruses) {
        if (!this.isActive) return;

        for (let i = this.pairs.length - 1; i >= 0; i--) {
            const pair = this.pairs[i];
            const v1Alive = this.isAlive(pair.virus1, allViruses);
            const v2Alive = this.isAlive(pair.virus2, allViruses);

            if (v1Alive && v2Alive) continue;

            if (v1Alive && !v2Alive) {
                pair.virus1.isEnraged = true;
            } else if (!v1Alive && v2Alive) {
                pair.virus2.isEnraged = true;
            }

            this.detachVirus(pair.virus1);
            this.detachVirus(pair.virus2);
            this.pairs.splice(i, 1);
        }
    }

    draw(ctx) {
        if (!this.isActive) return;

        for (let i = this.pairs.length - 1; i >= 0; i--) {
            const pair = this.pairs[i];
            if (!pair?.virus1 || !pair?.virus2) continue;

            const x1 = pair.virus1.x;
            const y1 = pair.virus1.y;
            const x2 = pair.virus2.x;
            const y2 = pair.virus2.y;

            if (![x1, y1, x2, y2].every(Number.isFinite)) {
                console.warn('[TetheredPairs] invalid coordinates, remove pair:', pair.id, { x1, y1, x2, y2 });
                this.detachVirus(pair.virus1);
                this.detachVirus(pair.virus2);
                this.pairs.splice(i, 1);
                continue;
            }

            this.drawTetherLink(ctx, x1, y1, x2, y2);
        }
    }

    drawTetherLink(ctx, x1, y1, x2, y2) {
        if (![x1, y1, x2, y2].every(Number.isFinite)) return;

        ctx.save();
        ctx.beginPath();
        ctx.lineWidth = this.config.linkWidth;
        ctx.lineCap = 'round';
        ctx.shadowBlur = this.config.glowBlur;

        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        gradient.addColorStop(0, this.config.linkColor[0]);
        gradient.addColorStop(1, this.config.linkColor[1]);
        ctx.strokeStyle = gradient;
        ctx.shadowColor = '#E6E6FA';

        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.restore();
    }

    getWarningCount() {
        return 0;
    }

    isAlive(virus, allViruses) {
        return !!(virus && allViruses.includes(virus) && virus.hp > 0);
    }

    detachVirus(virus) {
        if (!virus) return;
        virus.isTethered = false;
        virus.tetheredPairId = null;
    }
}
