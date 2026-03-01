import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

let URL = 'https://xxxspfngehfrgeakfwvo.supabase.co'
let KEY = 'sb_publishable_vyPTAQ6I8ZvS2fV9iS5mZw_5NcApI9L'

let supabase = createClient(URL, KEY)

let TRICKS_TABLE = 'tricks'

export async function findTricks() {
    console.debug('[DB] finding tricks')
    const { data, error } = await supabase
        .from(TRICKS_TABLE)
        .select()
        .order('updated_at', { ascending: false })
        .order('created_at', { ascending: false })
    if (error) throw error
    console.debug('[DB] found', data)
    return data
}

export async function createTrick(trickData) {
    console.debug('[DB] creating trick', trickData)
    const { data, error } = await supabase
        .from(TRICKS_TABLE)
        .insert(trickData)
        .select()
    if (error) throw error
    console.debug('[DB] created', data)
    return data
}

export async function fetchTrick(id) {
    console.debug('[DB] fetching trick', id)
    const { data, error } = await supabase
        .from(TRICKS_TABLE)
        .select()
        .eq('id', id)
    if (error) throw error
    if (!data.length) throw new Error('[DB] trick not found')
    console.debug('[DB] fetched', data[0])
    return data[0]
}

export async function updateTrick(id, trickData) {
    console.debug('[DB] updating trick', id, trickData)
    const { data, error } = await supabase
        .from(TRICKS_TABLE)
        .update(trickData)
        .eq('id', id)
        .select()
    if (error) throw error
    console.debug('[DB] updated', data)
    return data
}
