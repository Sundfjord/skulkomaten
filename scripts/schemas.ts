import { z } from 'zod'

export const PrepPlaceSchema = z.enum(['i', 'på'])

export const ActivitySchema = z.object({
  nb: z.string().min(1),
  nn: z.string().min(1),
})

export const PlaceSchema = z.object({
  navn: z.string().min(1),
  prep: PrepPlaceSchema,
})

export const ActivitiesSchema = z.array(ActivitySchema).min(1)
export const PlacesSchema = z.array(PlaceSchema).min(1)

const frameSchema = z.string().min(1).refine(
  (f) => f.includes('{aktivitet}') && (f.includes('{sted}') || f.includes('{stedNoPre}')),
  { message: 'Every template frame must contain {aktivitet} and either {sted} or {stedNoPre}' },
)

export const TemplateSchema = z.object({
  nb: frameSchema,
  nn: frameSchema,
})

export const TemplatesSchema = z.array(TemplateSchema).min(1)

export type Activity = z.infer<typeof ActivitySchema>
export type Place = z.infer<typeof PlaceSchema>
export type Template = z.infer<typeof TemplateSchema>
export type Templates = z.infer<typeof TemplatesSchema>
