<script setup lang="ts">
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { MailIcon } from 'lucide-vue-next';

type TProps = {
    id: string;
    icon?: boolean;
    focus?: boolean;
};

const { id, icon = false, focus = false } = defineProps<TProps>();
</script>

<template>
    <InputGroup>
        <InputGroupAddon v-if="icon">
            <slot name="icon">
                <MailIcon />
            </slot>
        </InputGroupAddon>
        <InputGroupInput type="email" :id="id" v-focus="focus" v-bind="$attrs" />
    </InputGroup>
</template>
