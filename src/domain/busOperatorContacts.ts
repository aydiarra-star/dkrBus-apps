/** Public information desks, not real-time feeds or evidence of service. */
export const BUS_OPERATOR_CONTACTS = {
  aftu: { name: 'AFTU', phone: '+221 33 859 02 88', sourceUrl: 'https://aftu-senegal.org/infos-pratiques/' },
  ddd: { name: 'Dakar Dem Dikk', phone: '+221 33 824 10 10', sourceUrl: 'https://cetud.sn/reseaux-de-transport/ddd/' },
} as const

export type BusOperatorContact = typeof BUS_OPERATOR_CONTACTS[keyof typeof BUS_OPERATOR_CONTACTS]
