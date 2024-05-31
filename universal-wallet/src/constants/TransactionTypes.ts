const txTypes: {[_: number]: {name: string; description: string; icon: {in?: string; out?: string}}} = {
  1: {name: 'genesis', description: 'Genesis', icon: {in: 'arrow-collapse-down'}},
  4: {name: 'transfer', description: 'Transfer', icon: {in: 'arrow-collapse-down', out: 'arrow-expand-up'}},
  8: {name: 'start_lease', description: 'Lease', icon: {in: 'bank-transfer-in', out: 'bank-outline'}},
  9: {name: 'cancel_lease', description: 'Cancel Lease', icon: {in: 'bank-transfer-out', out: 'bank-off-outline'}},
  11: {name: 'mass_transfer', description: 'Mass Transfer', icon: {in: 'arrow-collapse-down', out: 'arrow-expand-up'}},
  13: {name: 'script', description: 'Script', icon: {out: 'circle-small'}},
  15: {name: 'anchor', description: 'Anchor', icon: {out: 'circle-small'}},
  16: {name: 'invoke_association', description: 'Issue Association', icon: {in: 'circle-small', out: 'circle-small'}},
  17: {name: 'revoke_association', description: 'Revoke Association', icon: {in: 'circle-small', out: 'circle-small'}},
  18: {name: 'sponsor', description: 'Sponsorship', icon: {in: 'heart-outline', out: 'heart-outline'}},
  19: {
    name: 'cancel_sponsor',
    description: 'Cancel Sponsorship',
    icon: {in: 'heart-off-outline', out: 'heart-off-outline'},
  },
  20: {name: 'register', description: 'Register', icon: {out: 'circle-small'}},
  21: {name: 'burn', description: 'Burn', icon: {out: 'arrow-expand-up'}},
  22: {name: 'mapped_anchor', description: 'Mapped Anchor', icon: {out: 'circle-small'}},
  23: {name: 'statement', description: 'Statement', icon: {out: 'circle-small'}},
};

export default txTypes;
